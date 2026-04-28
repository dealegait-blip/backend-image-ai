<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Éditeur d'Image IA</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { margin-top: 0; color: #333; }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #555;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 14px;
        }
        .drop-zone {
            border: 2px dashed #ccc;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            background: #fafafa;
        }
        .drop-zone:hover, .drop-zone.drag-over {
            border-color: #007aff;
            background: #f0f7ff;
        }
        .preview-area {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .preview-card {
            flex: 1;
            text-align: center;
        }
        .preview-card img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #eee;
        }
        .preview-card p {
            margin: 10px 0 0;
            font-size: 14px;
            color: #666;
        }
        button {
            width: 100%;
            padding: 14px;
            background: #007aff;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover:not(:disabled) { background: #0056b3; }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #007aff;
        }
        .error {
            background: #fee;
            color: #c00;
            padding: 12px;
            border-radius: 10px;
            margin: 15px 0;
        }
        .info-note {
            background: #e8f0fe;
            padding: 12px;
            border-radius: 10px;
            font-size: 13px;
            color: #0066cc;
            margin-top: 20px;
        }
        .success { color: #28a745; text-align: center; margin-top: 15px; }
    </style>
</head>
<body>
<div class="container">
    <h1>🖼️ Éditeur d'Image IA</h1>
    <p>Modifie une photo existante avec une simple instruction texte</p>

    <div class="form-group">
        <label>🔑 Clé API OpenAI</label>
        <input type="password" id="apiKey" placeholder="sk-..." value="">
    </div>

    <div class="form-group">
        <label>📝 Prompt d'édition</label>
        <input type="text" id="prompt" placeholder="Ex: ajouter un chapeau rouge, transformer le ciel en coucher de soleil, changer la voiture en bleu...">
    </div>

    <div class="form-group">
        <label>🖱️ Photo à modifier</label>
        <div id="dropZone" class="drop-zone">
            📸 Cliquez ou glissez-déposez une image ici
            <input type="file" id="fileInput" accept="image/*" style="display:none">
        </div>
    </div>

    <div id="previewArea" class="preview-area" style="display:none;"></div>

    <button id="editBtn" disabled>✨ Modifier l'image</button>

    <div id="result"></div>

    <div class="info-note">
        💡 <strong>Important :</strong> Ce site utilise le modèle <strong>gpt-image-1-mini</strong> d'OpenAI.<br>
        Il modifie VOTRE photo selon votre prompt. La génération prend 10-30 secondes.
    </div>
</div>

<script>
    // Éléments DOM
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const apiKeyInput = document.getElementById('apiKey');
    const promptInput = document.getElementById('prompt');
    const editBtn = document.getElementById('editBtn');
    const previewArea = document.getElementById('previewArea');
    const resultDiv = document.getElementById('result');

    let currentImageFile = null;
    let currentImagePreview = null;

    // Gestion du drag & drop
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleImageFile(file);
        else alert('Veuillez déposer une image valide');
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImageFile(e.target.files[0]);
    });

    function handleImageFile(file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImagePreview = e.target.result;
            displayPreview(currentImagePreview);
            checkFormReady();
        };
        reader.readAsDataURL(file);
    }

    function displayPreview(imageSrc) {
        previewArea.style.display = 'flex';
        previewArea.innerHTML = `
            <div class="preview-card">
                <p>📷 Photo originale</p>
                <img src="${imageSrc}" alt="Original">
            </div>
            <div class="preview-card" id="resultPreview" style="opacity:0.5">
                <p>✨ Résultat (à venir)</p>
                <div style="height:200px; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:10px;">
                    ⏳ En attente...
                </div>
            </div>
        `;
    }

    function showResultImage(imageSrc) {
        const resultPreview = document.getElementById('resultPreview');
        if (resultPreview) {
            resultPreview.innerHTML = `
                <p>✨ Résultat modifié</p>
                <img src="${imageSrc}" alt="Result">
            `;
            resultPreview.style.opacity = '1';
        }
    }

    function checkFormReady() {
        const hasApiKey = apiKeyInput.value.trim().startsWith('sk-');
        const hasPrompt = promptInput.value.trim().length > 0;
        const hasImage = currentImageFile !== null;
        editBtn.disabled = !(hasApiKey && hasPrompt && hasImage);
    }

    apiKeyInput.addEventListener('input', checkFormReady);
    promptInput.addEventListener('input', checkFormReady);

    // Fonction principale d'édition
    editBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const prompt = promptInput.value.trim();

        if (!apiKey || !prompt || !currentImageFile) return;

        editBtn.disabled = true;
        editBtn.textContent = '⏳ Modification en cours... (20-30 secondes)';
        resultDiv.innerHTML = '<div class="loading">🎨 L\'IA travaille sur votre image...</div>';

        try {
            // Préparer le formulaire comme demandé par l'API OpenAI /images/edits
            const formData = new FormData();
            formData.append('model', 'gpt-image-1-mini');  // Modèle le plus rapide/polyvalent pour l'édition
            formData.append('prompt', prompt);
            formData.append('image', currentImageFile);
            formData.append('n', '1');
            formData.append('size', '1024x1024');  // Taille de sortie
            formData.append('response_format', 'b64_json');

            const response = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data[0] && data.data[0].b64_json) {
                const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
                showResultImage(imageUrl);
                resultDiv.innerHTML = '<div class="success">✅ Image modifiée avec succès !</div>';
            } else {
                throw new Error('Format de réponse inattendu');
            }

        } catch (error) {
            console.error('Erreur:', error);
            let errorMsg = error.message;
            if (errorMsg.includes('insufficient_quota')) errorMsg = '⚠️ Quota dépassé. Vérifie ton crédit OpenAI.';
            else if (errorMsg.includes('invalid_api_key')) errorMsg = '⚠️ Clé API invalide. Vérifie ta clé.';
            else if (errorMsg.includes('rate_limit')) errorMsg = '⚠️ Trop de requêtes. Attends un moment.';
            
            resultDiv.innerHTML = `<div class="error">❌ Erreur : ${errorMsg}</div>`;
            // Réinitialiser l'affichage du résultat
            const resultPreview = document.getElementById('resultPreview');
            if (resultPreview) {
                resultPreview.innerHTML = `<p>✨ Résultat</p><div style="height:200px; display:flex; align-items:center; justify-content:center; background:#fee; border-radius:10px;">❌ Échec</div>`;
            }
        } finally {
            editBtn.disabled = false;
            editBtn.textContent = '✨ Modifier l\'image';
        }
    });

    // Chargement d'une clé sauvegardée (optionnel)
    if (localStorage.getItem('openai_api_key')) {
        apiKeyInput.value = localStorage.getItem('openai_api_key');
        checkFormReady();
    }
    apiKeyInput.addEventListener('change', () => {
        if (apiKeyInput.value.trim()) localStorage.setItem('openai_api_key', apiKeyInput.value.trim());
        else localStorage.removeItem('openai_api_key');
    });
</script>
</body>
</html>
