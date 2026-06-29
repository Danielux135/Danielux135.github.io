const DEFAULT_CONTACT_API_URL = 'https://danielux-api-proxy.dlux135.workers.dev/api/contact';
const LOCAL_STORAGE_KEY = 'danielux:contact-api-url';

function getContactEndpoint(form) {
    const override = window.DANIELUX_CONTACT_API_URL
        || window.localStorage?.getItem(LOCAL_STORAGE_KEY)
        || form.dataset.apiUrl
        || DEFAULT_CONTACT_API_URL;

    return String(override).trim();
}

function setStatus(form, message, type = '') {
    const status = form.querySelector('[data-contact-status]');
    if (!status) return;

    status.textContent = message;
    status.classList.remove('is-success', 'is-error');

    if (type) {
        status.classList.add(`is-${type}`);
    }
}

function getPayload(form) {
    const data = new FormData(form);
    return {
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        message: String(data.get('message') || '').trim(),
        website: String(data.get('website') || '').trim()
    };
}

function validatePayload(payload) {
    if (!payload.name || payload.name.length > 80) {
        return 'Revisa el nombre.';
    }

    if (!payload.email || payload.email.length > 120 || !payload.email.includes('@')) {
        return 'Revisa el email.';
    }

    if (!payload.message || payload.message.length > 3000) {
        return 'El mensaje está vacío o es demasiado largo.';
    }

    return '';
}

async function submitContactForm(form) {
    const endpoint = getContactEndpoint(form);
    const payload = getPayload(form);
    const validationError = validatePayload(payload);

    if (validationError) {
        setStatus(form, validationError, 'error');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const previousButtonHTML = submitButton?.innerHTML;

    form.classList.add('is-sending');
    setStatus(form, 'Enviando mensaje…');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando…';
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
            throw new Error(result?.error || 'No se pudo enviar el mensaje.');
        }

        form.reset();
        setStatus(form, 'Mensaje enviado correctamente. Te responderé lo antes posible.', 'success');
    } catch (error) {
        setStatus(form, error?.message || 'No se pudo enviar el mensaje. Inténtalo más tarde.', 'error');
    } finally {
        form.classList.remove('is-sending');

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = previousButtonHTML;
        }
    }
}

export function initContactForm() {
    const forms = document.querySelectorAll('[data-contact-form]');

    forms.forEach((form) => {
        if (form.dataset.contactReady === 'true') return;
        form.dataset.contactReady = 'true';

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submitContactForm(form);
        });
    });
}

initContactForm();
