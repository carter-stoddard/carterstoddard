/* ============================================================
   SERVICES-MODAL.JS
   Bento tile click → fullscreen modal with service details.
   ============================================================ */

(function() {
  var SERVICES = [
    {
      num: '01',
      name: 'Web Design, Development & Apps',
      desc: 'Custom-coded websites and digital products built from scratch. No templates. No page builders.',
      pills: ['Custom website design', 'Custom development', 'Landing pages', 'E-commerce (Shopify)', 'WordPress & Webflow', 'Web apps', 'Performance optimization', 'Hosting & domain setup', 'Ongoing maintenance']
    },
    {
      num: '02',
      name: 'Branding & Identity',
      desc: 'A brand that looks the part and means something — from first sketch to final guidelines.',
      pills: ['Logo design', 'Full visual identity', 'Color & typography system', 'Brand guidelines', 'Brand naming', 'Positioning strategy', 'Brand voice & messaging', 'Brand refreshes']
    },
    {
      num: '03',
      name: 'AI & Automation',
      desc: 'Custom AI workflows and automations that save time, scale output, and give your business a real edge.',
      pills: ['AI content workflows', 'Custom GPT creation', 'AI image & video generation', 'Chatbot setup', 'Zapier / Make / n8n', 'CRM automation', 'AI-powered email', 'AI SEO / AIO']
    },
    {
      num: '04',
      name: 'Social Media Content & Management',
      desc: 'Strategy, creation, and full management — so your social presence actually works for you.',
      pills: ['Social strategy', 'Content calendar', 'Post creation', 'Scheduling & publishing', 'Community management', 'Influencer outreach', 'Analytics & reporting']
    },
    {
      num: '05',
      name: 'Video, Motion & Photography',
      desc: 'Cinematic content from concept to delivery — sizzle reels, campaigns, web animations, and more.',
      pills: ['Short-form video editing', 'Long-form video editing', 'On-location videography', 'Motion graphics', 'GSAP web animations', 'Brand photography', 'Product photography', 'Photo retouching']
    },
    {
      num: '06',
      name: 'AI Search & SEO',
      desc: 'Rank in traditional search and get cited by AI — the two biggest discovery engines right now.',
      pills: ['On-page SEO', 'Technical SEO', 'Local SEO', 'Keyword research & audits', 'Link building', 'AI SEO / AIO', 'Schema markup', 'Content for search']
    },
    {
      num: '07',
      name: 'Print & Digital Graphic Design',
      desc: 'Everything visual that isn\'t a website — ads, packaging, decks, print, and more.',
      pills: ['Social media graphics', 'Print design', 'Packaging design', 'Pitch decks', 'Ad creative', 'Infographics', 'Product mockups & renders']
    },
    {
      num: '08',
      name: 'Strategy & Creative Direction',
      desc: 'High-level thinking that makes everything else sharper — from UX to creative oversight.',
      pills: ['UI/UX design', 'App design', 'User research', 'Design systems', 'Creative direction', 'Content strategy', 'Market research', 'Competitor analysis']
    },
    {
      num: '09',
      name: 'Copywriting & Email Marketing',
      desc: 'Words that sell. Website copy, ad copy, email sequences — written to convert, not just fill space.',
      pills: ['Website copy', 'Ad copy', 'Social captions & hooks', 'Brand messaging', 'Blog & long-form', 'Email campaigns', 'Email automation', 'Script writing']
    },
    {
      num: '10',
      name: 'Paid Advertising',
      desc: 'Full-funnel campaigns across every major platform — built to perform, not just spend budget.',
      pills: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads', 'Ad strategy & media planning', 'Ad creative production', 'Analytics & reporting', 'Retargeting']
    }
  ];

  var modal      = document.getElementById('services-modal');
  var closeBtn   = document.getElementById('services-modal-close');
  var numEl      = document.getElementById('services-modal-num');
  var nameEl     = document.getElementById('services-modal-name');
  var descEl     = document.getElementById('services-modal-desc');
  var pillsEl    = document.getElementById('services-modal-pills');
  var ctaEl      = document.getElementById('services-modal-cta');
  var tiles      = document.querySelectorAll('.services__tile');
  if (!modal || !tiles.length) return;

  function open(index) {
    var data = SERVICES[index];
    if (!data) return;

    numEl.textContent  = data.num;
    nameEl.textContent = data.name;
    descEl.textContent = data.desc;

    pillsEl.innerHTML = '';
    data.pills.forEach(function(text, i) {
      var pill = document.createElement('span');
      pill.className = 'services-modal__pill' + (i < 2 ? ' services-modal__pill--accent' : '');
      pill.textContent = text;
      pillsEl.appendChild(pill);
    });

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  tiles.forEach(function(tile) {
    tile.addEventListener('click', function() {
      var idx = parseInt(tile.getAttribute('data-service-index'), 10);
      if (!isNaN(idx)) open(idx);
    });
  });

  closeBtn.addEventListener('click', close);

  // Close on backdrop click (outside the panel)
  modal.addEventListener('click', function(e) {
    if (e.target === modal) close();
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  // CTA inside modal — close before scrolling to contact so the body scroll works
  if (ctaEl) {
    ctaEl.addEventListener('click', function() { close(); });
  }
})();
