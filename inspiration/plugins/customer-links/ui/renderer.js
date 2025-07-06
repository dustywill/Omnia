{
  /**
   * @file plugins/customer-links/ui/renderer.js
   * @description Renders the customer links page inside ttCommander.
   */

  const pluginId = 'com.ttcommander.customer-links';
  let pluginConfig = {};


  /** CSS variables copied from the main stylesheet for standalone output */
  const CSS_VARIABLES = `
:root {
    --tt-palette--n95: #eceeee;
    --tt-palette--n90: #e3e7e8;
    --tt-palette--n80: #caced3;
    --tt-palette--n70: #aeb4bc;
    --tt-palette--n60: #929aa5;
    --tt-palette--n50: #76818e;
    --tt-palette--n40: #5e6773;
    --tt-palette--n30: #454e59;
    --tt-palette--n20: #2e343d;
    --tt-palette--n10: #15191e;

    --tt-palette--b95: #e5efff;
    --tt-palette--b90: #dbe9ff;
    --tt-palette--b80: #b3d3fe;
    --tt-palette--b70: #89b9fb;
    --tt-palette--b60: #64a1f7;
    --tt-palette--b50: #3d89f5;
    --tt-palette--b40: #1e6de6;
    --tt-palette--b30: #1555b2;
    --tt-palette--b20: #0d3778;
    --tt-palette--b10: #051d42;

    --tt-palette--c95: #e1f9f9;
    --tt-palette--c90: #d4f7f7;
    --tt-palette--c80: #a5efef;
    --tt-palette--c70: #7ee8e8;
    --tt-palette--c60: #5adcdc;
    --tt-palette--c50: #2dcdcd;
    --tt-palette--c40: #0cbbbb;
    --tt-palette--c30: #008a8a;
    --tt-palette--c20: #006161;
    --tt-palette--c10: #002929;

    --tt-palette--g95: #dffbe7;
    --tt-palette--g90: #cff7d9;
    --tt-palette--g80: #a5e8b6;
    --tt-palette--g70: #79dd92;
    --tt-palette--g60: #4bd26d;
    --tt-palette--g50: #2fbc52;
    --tt-palette--g40: #1da53f;
    --tt-palette--g30: #157a2e;
    --tt-palette--g20: #0e4e1e;
    --tt-palette--g10: #06230d;

    --tt-palette--y95: #fefad2;
    --tt-palette--y90: #fff9b3;
    --tt-palette--y80: #fff280;
    --tt-palette--y70: #ffe752;
    --tt-palette--y60: #ffdb2e;
    --tt-palette--y50: #ffcd08;
    --tt-palette--y40: #e5b000;
    --tt-palette--y30: #bd8c00;
    --tt-palette--y20: #8f6400;
    --tt-palette--y10: #422b00;

    --tt-palette--o95: #ffeee0;
    --tt-palette--o90: #ffdfc7;
    --tt-palette--o80: #ffdfc7;
    --tt-palette--o70: #ffaf70;
    --tt-palette--o60: #ff9542;
    --tt-palette--o50: #ff7a14;
    --tt-palette--o40: #eb6400;
    --tt-palette--o30: #c24e00;
    --tt-palette--o20: #8a3700;
    --tt-palette--o10: #421a00;

    --tt-palette--r95: #fdeded;
    --tt-palette--r90: #fddddd;
    --tt-palette--r80: #fbb7b7;
    --tt-palette--r70: #f79c9c;
    --tt-palette--r60: #f36d6d;
    --tt-palette--r50: #ec3c3c;
    --tt-palette--r40: #d31d23;
    --tt-palette--r30: #9f191d;
    --tt-palette--r20: #5f1618;
    --tt-palette--r10: #310c0d;

    --tt-palette--m95: #feecfb;
    --tt-palette--m90: #fed7f7;
    --tt-palette--m80: #fbb7f0;
    --tt-palette--m70: #f6a2e8;
    --tt-palette--m60: #ee7cdb;
    --tt-palette--m50: #e750ce;
    --tt-palette--m40: #d426b8;
    --tt-palette--m30: #aa1d91;
    --tt-palette--m20: #6c135d;
    --tt-palette--m10: #370b30;

    --tt-palette--v95: #f1ecfe;
    --tt-palette--v90: #ebe3fe;
    --tt-palette--v80: #d6c6fb;
    --tt-palette--v70: #c1aaf8;
    --tt-palette--v60: #ab8cf4;
    --tt-palette--v50: #9771ef;
    --tt-palette--v40: #7f50ec;
    --tt-palette--v30: #6835de;
    --tt-palette--v20: #46219c;
    --tt-palette--v10: #241448;

    --tt-palette--white: #fff;
    --tt-palette--black: #000;
    --tt-palette--light: #fffd;
    --tt-palette--dark : #000c;
    --tt-palette--hilight: #fff3;
    --tt-palette--lolight: #0002;

    --tt-palette--action : var(--tt-palette--b40);
    --tt-palette--neutral: var(--tt-palette--n40);
    --tt-palette--link   : var(--tt-palette--b40);
    --tt-palette--info   : var(--tt-palette--c40);
    --tt-palette--success: var(--tt-palette--g40);
    --tt-palette--warning: var(--tt-palette--o40);
    --tt-palette--danger : var(--tt-palette--r40);

    --tt-palette--brand-primary: #1555b2;
    --tt-palette--brand-accent : #ffcd08;
}`;

  async function loadCustomerData() {
    const plugins = await window.pluginAPI.getDiscovered();
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin) throw new Error('Plugin metadata not found');
    const jsonPath = await window.utilityAPI.join(plugin.pluginPath, 'customers.json');
    const [result] = await window.fileSystemAPI.readFiles([jsonPath]);
    if (result.error) throw new Error(result.error);
    return JSON.parse(result.content);
  }

  function createSiteItem(site, isFirst) {
    if (!site || !site.IPAddress || !site.Label || typeof site.Link === 'undefined') {
      return '';
    }
    const safeLabel = site.Label.replace(/[<>"']/g, '');
    const safeLocation = (site.Location || '').replace(/[<>"']/g, '');
    const safeIP = site.IPAddress.replace(/[^\w.-]/g, '');
    const linkPath = site.Link ? (String(site.Link).startsWith('/') ? site.Link : '/' + site.Link) : '/';
    const url = `http://${safeIP}${linkPath}`;
    const logo = site.LogoFile ? `<img src="http://${safeIP}/images/${site.LogoFile.replace(/\.\.[/\\]/g,'')}" alt="${safeLabel} Logo" class="site-logo">` : '<span class="site-logo-placeholder">Logo</span>';
    return `
      <li class="site-item ${isFirst ? 'first-site' : 'extra-site collapsed'}">
        <a href="${encodeURI(url)}" class="site-link" target="_blank" rel="noopener noreferrer" data-tooltip="${safeLocation}">
          <div class="site-logo-container">${logo}</div>
          <span class="site-label">${safeLabel}</span>
        </a>
      </li>`;
  }

  function createCustomerCard(customer) {
    if (!customer || !customer.CustomerName || !Array.isArray(customer.sites) || customer.sites.length === 0) {
      return '';
    }
    const safeName = customer.CustomerName.replace(/[<>"']/g, '');
    const headerClasses = ['customer-header'];
    if (customer.sites.length > 1) headerClasses.push('collapsible-trigger');
    const sitesHtml = customer.sites
      .map((s, i) => createSiteItem(s, i === 0))
      .join('');
    return `
      <div class="customer-card">
        <h2 class="${headerClasses.join(' ')}">${safeName}</h2>
        <ul class="site-list">${sitesHtml}</ul>
      </div>`;
  }

  function attachCollapsibleHandlers(container) {
    const triggers = container.querySelectorAll('.customer-header.collapsible-trigger');
    triggers.forEach((header) => {
      const siteList = header.nextElementSibling;
      if (!siteList || !siteList.querySelector('.extra-site')) {
        header.classList.remove('collapsible-trigger');
        return;
      }
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', 'false');
      header.addEventListener('click', function () {
        this.classList.toggle('active');
        const expanded = this.classList.contains('active');
        this.setAttribute('aria-expanded', String(expanded));
        siteList.querySelectorAll('.extra-site').forEach((li) => li.classList.toggle('collapsed'));
      });
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }


  /**
   * Generates a complete standalone HTML document.
   * @param {Array<object>} customersData Parsed customer JSON data.
   * @param {string} cssContent CSS rules for the page.
   * @returns {string} Standalone HTML string.
   */
  function generateFullHTML(customersData, cssContent) {
    const cards = customersData.map(createCustomerCard).join('');
    const clientJs = `
        document.addEventListener('DOMContentLoaded', function () {
            const collapsibleTriggers = document.querySelectorAll('.customer-header.collapsible-trigger');

            collapsibleTriggers.forEach(header => {
                const siteList = header.nextElementSibling;
                if (!siteList || !siteList.classList.contains('site-list') || !siteList.querySelector('.extra-site')) {
                    header.classList.remove('collapsible-trigger');
                    return;
                }

                header.setAttribute('role', 'button');
                header.setAttribute('tabindex', '0');
                header.setAttribute('aria-expanded', 'false');

                header.addEventListener('click', function () {
                    this.classList.toggle('active');
                    const expanded = this.classList.contains('active');
                    this.setAttribute('aria-expanded', expanded.toString());

                    const extras = siteList.querySelectorAll('.extra-site');
                    extras.forEach(item => item.classList.toggle('collapsed'));
                });

                header.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.click();
                    }
                });
            });
        });
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Application Links</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
    <style>
        ${CSS_VARIABLES}
        ${cssContent}
    </style>
</head>
<body class="customer-links-body">
    <h1>Customer Application Links</h1>
    <div class="customer-grid">
        ${cards}
    </div>
    <script>
        ${clientJs}
    </script>
</body>
</html>`;
  }


  async function saveStandalonePage() {
    const btn = document.getElementById('save-page-btn');
    if (btn) btn.disabled = true;
    try {
      const cfgResp = await window.configAPI.getConfigAndSchema();
      if (!cfgResp.success) throw new Error(cfgResp.error);
      pluginConfig = cfgResp.config.plugins?.[pluginId] || {};

      const savePath =
        pluginConfig.savePath ||
        'c:\\Tutelar\\Spiderworks\\pages\\home\\customers.html';
      const root = await window.fileSystemAPI.getRootPath();
      const targetPath = await window.utilityAPI.resolve(root, savePath);
      const plugins = await window.pluginAPI.getDiscovered();
      const plugin = plugins.find((p) => p.id === pluginId);
      if (!plugin) throw new Error('Plugin metadata not found');
      const stylePath = await window.utilityAPI.join(
        plugin.pluginPath,
        'ui',
        'styles.css'
      );
      const [styleResult] = await window.fileSystemAPI.readFiles([stylePath]);
      if (styleResult.error) throw new Error(styleResult.error);

      const customers = await loadCustomerData();
      const html = generateFullHTML(customers, styleResult.content);
      const result = await window.fileSystemAPI.writeFile(targetPath, html);
      if (!result.success) throw new Error(result.error);
      if (btn) {
        btn.textContent = 'Saved!';
        setTimeout(() => (btn.textContent = 'Save Page'), 2000);
      }
    } catch (err) {
      console.error('Failed to save page:', err);
      if (btn) {
        btn.textContent = 'Error';
        setTimeout(() => (btn.textContent = 'Save Page'), 2000);
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function initialize() {
    const grid = document.getElementById('customer-grid');
    const saveBtn = document.getElementById('save-page-btn');
    try {
      const data = await loadCustomerData();
      grid.innerHTML = data.map(createCustomerCard).join('');
      attachCollapsibleHandlers(grid);
      if (saveBtn) saveBtn.addEventListener('click', saveStandalonePage);
    } catch (err) {
      grid.innerHTML = `<p class="error-text">${err.message}</p>`;
      console.error('Failed to load customer links:', err);
    }
  }

  initialize();
}
