/* ==========================================================================
   PHOENIX RISE — NAVIGATION, INTERACTION & PHOENIX CRM INTEGRATION SCRIPT
   ========================================================================== */

// PHOENIX CRM CONFIGURATION
const PHOENIX_CRM_CONFIG = {
  enabled: true,
  webhookUrl: 'https://crm-phoenixrise.vercel.app/api/webhook',
  apiKey: '', // Chave de API se necessário (opcional)
  sourceName: 'Website Phoenix Rise - Formulário de Diagnóstico'
};

document.addEventListener('DOMContentLoaded', function () {
  // 1. Mobile Nav Toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('mobile-open'));
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  // 2. FAQ Accordion Handler
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      if (!item) return;

      const isCurrentActive = item.classList.contains('active');

      // Close other accordion items in the same container
      const parentAccordion = item.closest('.faq-accordion');
      if (parentAccordion) {
        parentAccordion.querySelectorAll('.faq-item').forEach(sibling => {
          sibling.classList.remove('active');
        });
      }

      // Toggle current item
      if (!isCurrentActive) {
        item.classList.add('active');
      }
    });
  });

  // 3. Lead Form & Phoenix CRM Submission Handler
  const leadForm = document.getElementById('lead-diagnostic-form');
  const successMsg = document.getElementById('form-success-msg');

  if (leadForm) {
    leadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando para o CRM...</span>';
      }

      const name = document.getElementById('form-name')?.value || '';
      const email = document.getElementById('form-email')?.value || '';
      const phone = document.getElementById('form-phone')?.value || '';
      const segment = document.getElementById('form-segment')?.value || 'Não informado';
      const budget = document.getElementById('form-budget')?.value || 'Não informado';

      const leadPayload = {
        name: name,
        email: email,
        phone: phone,
        segment: segment,
        budget: budget,
        source: PHOENIX_CRM_CONFIG.sourceName,
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageUrl: window.location.href
      };

      // Send Lead Payload to Phoenix CRM Endpoint
      if (PHOENIX_CRM_CONFIG.enabled && PHOENIX_CRM_CONFIG.webhookUrl) {
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (PHOENIX_CRM_CONFIG.apiKey) {
            headers['Authorization'] = `Bearer ${PHOENIX_CRM_CONFIG.apiKey}`;
          }

          const response = await fetch(PHOENIX_CRM_CONFIG.webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(leadPayload)
          });

          console.log('[Phoenix CRM] Lead cadastrado com sucesso:', response.status);
        } catch (error) {
          console.warn('[Phoenix CRM] Erro ao enviar lead para o CRM:', error);
          // Salvamento preventivo no LocalStorage para não perder nenhum lead se falhar a rede
          saveLeadBackupLocally(leadPayload);
        }
      } else {
        saveLeadBackupLocally(leadPayload);
      }

      // Visual success state
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.innerHTML = `✨ <strong>Obrigado, ${name.split(' ')[0]}!</strong> Seu cadastro foi enviado para o nosso sistema.<br>Nossa equipe entrará em contato em breve via WhatsApp (${phone}) ou E-mail.`;
      }

      // Construct WhatsApp direct trigger message link
      const encodedMsg = encodeURIComponent(
        `Olá! Acabei de enviar o formulário no site Phoenix Rise.\n\n` +
        `👤 Nome: ${name}\n` +
        `📧 E-mail: ${email}\n` +
        `📱 WhatsApp: ${phone}\n` +
        `🏢 Segmento: ${segment}\n` +
        `💰 Orçamento Mídia: ${budget}`
      );

      const waBtnHtml = `<br><a href="https://wa.me/5500000000000?text=${encodedMsg}" target="_blank" rel="noopener" style="display:inline-block; margin-top:14px; padding:10px 20px; background:#25D366; color:#fff; border-radius:24px; font-weight:600; text-decoration:none;">Falar imediatamente no WhatsApp →</a>`;
      if (successMsg) {
        successMsg.innerHTML += waBtnHtml;
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

      leadForm.reset();
    });
  }

  // Helper: Lead Backup Local Storage
  function saveLeadBackupLocally(leadData) {
    try {
      const existingLeads = JSON.parse(localStorage.getItem('phoenix_rise_leads') || '[]');
      existingLeads.push(leadData);
      localStorage.getItem('phoenix_rise_leads', JSON.stringify(existingLeads));
    } catch (err) {
      console.error('Local backup failed', err);
    }
  }

  // 4. Smooth scroll active state highlighting
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navAnchor = document.querySelector(`.nav-links a[href*="#${sectionId}"]`);
      
      if (navAnchor) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navAnchor.classList.add('active');
        } else {
          navAnchor.classList.remove('active');
        }
      }
    });
  });
});
