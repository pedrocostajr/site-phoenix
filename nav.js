/* ==========================================================================
   PHOENIX RISE — NAVIGATION, INTERACTION & PHOENIX OS WEBHOOK INTEGRATION
   ========================================================================== */

// 1. Constante única do Webhook
const PHOENIX_WEBHOOK_URL = 'https://os.phoenixrise.com.br/api/public/webhooks/HEl5S7aEep1SyoDSp5F2UnqmykQ13Y7d';

// 2. Captura e persistência de parâmetros UTM no sessionStorage
function captureAndStoreUTMs() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    
    utmKeys.forEach(key => {
      const val = urlParams.get(key);
      if (val && val.trim() !== '') {
        sessionStorage.setItem(key, val.trim());
      }
    });
  } catch (err) {
    console.warn('[UTM Storage Warning]', err);
  }
}

// Executa a captura de UTMs imediatamente ao carregar o script
captureAndStoreUTMs();

function getUTMData() {
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utms = {};
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    utmKeys.forEach(key => {
      const val = urlParams.get(key) || sessionStorage.getItem(key);
      if (val && val.trim() !== '') {
        utms[key] = val.trim();
      }
    });
  } catch (err) {
    console.warn('[UTM Retrieval Warning]', err);
  }
  
  return utms;
}

document.addEventListener('DOMContentLoaded', function () {
  // Mobile Nav Toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('mobile-open'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  // FAQ Accordion Handler
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      if (!item) return;

      const isCurrentActive = item.classList.contains('active');
      const parentAccordion = item.closest('.faq-accordion');
      if (parentAccordion) {
        parentAccordion.querySelectorAll('.faq-item').forEach(sibling => {
          sibling.classList.remove('active');
        });
      }

      if (!isCurrentActive) {
        item.classList.add('active');
      }
    });
  });

  // Lead Diagnostic Form Submission Handler
  const leadForm = document.getElementById('lead-diagnostic-form');
  const successMsg = document.getElementById('form-success-msg');

  if (leadForm) {
    leadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando...</span>';
      }

      // Monta objeto com todos os possíveis campos
      const rawPayload = {
        nome: document.getElementById('form-name')?.value?.trim(),
        email: document.getElementById('form-email')?.value?.trim(),
        telefone: document.getElementById('form-phone')?.value?.trim(),
        empresa: document.getElementById('form-company')?.value?.trim() || document.getElementById('form-empresa')?.value?.trim(),
        segmento: document.getElementById('form-segment')?.value?.trim(),
        orcamento: document.getElementById('form-budget')?.value?.trim(),
        mensagem: document.getElementById('form-message')?.value?.trim() || document.getElementById('form-mensagem')?.value?.trim(),
        origem: 'Website Phoenix Rise',
        ...getUTMData(),
        pagina: window.location.href
      };

      // Filtra para enviar somente os campos que possuem valor preenchido
      const dados = {};
      Object.keys(rawPayload).forEach(key => {
        const val = rawPayload[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          dados[key] = String(val).trim();
        }
      });

      try {
        const response = await fetch(PHOENIX_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dados),
          keepalive: true
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[Webhook Error] Status: ${response.status}`, errorBody);
          if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.style.color = '#EF4444';
            successMsg.innerHTML = 'Não foi possível enviar, tente novamente';
          }
          return;
        }

        const jsonResult = await response.json().catch(() => ({}));

        if (jsonResult && jsonResult.ok === true) {
          if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.style.color = '';
            successMsg.innerHTML = `✨ <strong>Obrigado, ${(dados.nome || '').split(' ')[0]}!</strong> Seu diagnóstico foi agendado com sucesso.<br>Nossa equipe entrará em contato em breve via WhatsApp (${dados.telefone || ''}) ou E-mail.`;
            
            const encodedMsg = encodeURIComponent(
              `Olá! Acabei de enviar o formulário no site Phoenix Rise.\n\n` +
              `👤 Nome: ${dados.nome || ''}\n` +
              `📧 E-mail: ${dados.email || ''}\n` +
              `📱 WhatsApp: ${dados.telefone || ''}\n` +
              `🏢 Segmento: ${dados.segmento || ''}\n` +
              `💰 Orçamento Mídia: ${dados.orcamento || ''}`
            );
            successMsg.innerHTML += `<br><a href="https://wa.me/5554996895454?text=${encodedMsg}" target="_blank" rel="noopener" style="display:inline-block; margin-top:14px; padding:10px 20px; background:#25D366; color:#fff; border-radius:24px; font-weight:600; text-decoration:none;">Falar imediatamente no WhatsApp →</a>`;
          }

          leadForm.reset();
        } else {
          console.error('[Webhook Error] Resposta sem ok: true', jsonResult);
          if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.style.color = '#EF4444';
            successMsg.innerHTML = 'Não foi possível enviar, tente novamente';
          }
        }
      } catch (err) {
        console.error('[Webhook Error]', err);
        if (successMsg) {
          successMsg.style.display = 'block';
          successMsg.style.color = '#EF4444';
          successMsg.innerHTML = 'Não foi possível enviar, tente novamente';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // Active navigation highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const navItem = document.querySelector(`.nav-links a[href*=${sectionId}]`);

      if (navItem) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navItem.classList.add('active');
        } else {
          navItem.classList.remove('active');
        }
      }
    });
  });
});
