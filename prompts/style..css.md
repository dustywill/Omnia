- When using colors anywhere css or not, use only the following colors.
- Do not include inline styles anywhere. All styles must be achieved through CSS.
- The preferred font is **Nunito Sans** loaded from Google Fonts

:root {
/_ Neutral Colors _/
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

/_ Blue Colors _/
--tt-palette--b95: #e5efff;
--tt-palette--b90: #dbe9ff;
--tt-palette--b80: #b3d3fe;
--tt-palette--b70: #89b9fb;
--tt-palette--b60: #64a1f7;
--tt-palette--b50: #3d89f5;
--tt-palette--b40: #1e6de6; /_ Action Blue _/
--tt-palette--b30: #1555b2; /_ Brand Primary _/
--tt-palette--b20: #0d3778;
--tt-palette--b10: #051d42;

/_ Cyan Colors _/
--tt-palette--c95: #e1f9f9;
--tt-palette--c90: #d4f7f7;
--tt-palette--c80: #a5efef;
--tt-palette--c70: #7ee8e8;
--tt-palette--c60: #5adcdc;
--tt-palette--c50: #2dcdcd;
--tt-palette--c40: #0cbbbb; /_ Info Cyan _/
--tt-palette--c30: #008a8a;
--tt-palette--c20: #006161;
--tt-palette--c10: #002929;

/_ Green Colors _/
--tt-palette--g95: #dffbe7;
--tt-palette--g90: #cff7d9;
--tt-palette--g80: #a5e8b6;
--tt-palette--g70: #79dd92;
--tt-palette--g60: #4bd26d;
--tt-palette--g50: #2fbc52;
--tt-palette--g40: #1da53f; /_ Success Green _/
--tt-palette--g30: #157a2e;
--tt-palette--g20: #0e4e1e;
--tt-palette--g10: #06230d;

/_ Yellow Colors _/
--tt-palette--y95: #fefad2;
--tt-palette--y90: #fff9b3;
--tt-palette--y80: #fff280;
--tt-palette--y70: #ffe752;
--tt-palette--y60: #ffdb2e;
--tt-palette--y50: #ffcd08; /_ Brand Accent _/
--tt-palette--y40: #e5b000;
--tt-palette--y30: #bd8c00;
--tt-palette--y20: #8f6400;
--tt-palette--y10: #422b00;

/_ Orange Colors _/
--tt-palette--o95: #ffeee0;
--tt-palette--o90: #ffdfc7;
--tt-palette--o80: #ffc9a3;
--tt-palette--o70: #ffaf70;
--tt-palette--o60: #ff9542;
--tt-palette--o50: #ff7a14;
--tt-palette--o40: #eb6400; /_ Warning Orange _/
--tt-palette--o30: #c24e00;
--tt-palette--o20: #8a3700;
--tt-palette--o10: #421a00;

/_ Red Colors _/
--tt-palette--r95: #fdeded;
--tt-palette--r90: #fddddd;
--tt-palette--r80: #fbb7b7;
--tt-palette--r70: #f79c9c;
--tt-palette--r60: #f36d6d;
--tt-palette--r50: #ec3c3c;
--tt-palette--r40: #d31d23; /_ Danger Red _/
--tt-palette--r30: #9f191d;
--tt-palette--r20: #5f1618;
--tt-palette--r10: #310c0d;

/_ Magenta Colors _/
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

/_ Violet Colors _/
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

/_ General Palette _/
--tt-palette--white: #fff;
--tt-palette--black: #000;
--tt-palette--light-alpha: #ffffffdd; /_ white with alpha _/
--tt-palette--dark-alpha: #000000cc; /_ black with alpha _/
--tt-palette--highlight-alpha: #ffffff33;
--tt-palette--lowlight-alpha: #00000022;

/_ Semantic Colors (using base palette) _/
--tt-palette--action: var(--tt-palette--b40);
--tt-palette--neutral: var(--tt-palette--n40);
--tt-palette--link: var(--tt-palette--b40);
--tt-palette--info: var(--tt-palette--c40);
--tt-palette--success: var(--tt-palette--g40);
--tt-palette--warning: var(--tt-palette--o40);
--tt-palette--danger: var(--tt-palette--r40);

/_ Brand Colors (using base palette) _/
--tt-palette--brand-primary: var(--tt-palette--b30);
--tt-palette--brand-accent: var(--tt-palette--y50);

/_ --- Theme UI Element Role Colors --- _/
/_ Light Theme Variables _/
--tt-color-background-body-light: var(--tt-palette--n95);
--tt-color-text-primary-light: var(--tt-palette--n10);
--tt-color-text-secondary-light: var(--tt-palette--n30);
--tt-color-surface-light: var(--tt-palette--white);
--tt-color-border-light: var(--tt-palette--n80);
--tt-color-header-background-light: var(--tt-palette--brand-primary);
--tt-color-header-text-light: var(--tt-palette--white);
--tt-color-footer-background-light: var(--tt-palette--n90);
--tt-color-footer-text-light: var(--tt-palette--n20);
--tt-color-button-background-light: var(--tt-palette--action);
--tt-color-button-text-light: var(--tt-palette--white);

/_ Dark Theme Variables _/
--tt-color-background-body-dark: var(--tt-palette--n10);
--tt-color-text-primary-dark: var(--tt-palette--n90);
--tt-color-text-secondary-dark: var(--tt-palette--n70);
--tt-color-surface-dark: var(--tt-palette--n20);
--tt-color-border-dark: var(--tt-palette--n40);
--tt-color-header-background-dark: var(--tt-palette--n20);
--tt-color-header-text-dark: var(--tt-palette--n90);
--tt-color-footer-background-dark: var(--tt-palette--n20);
--tt-color-footer-text-dark: var(--tt-palette--n70);
--tt-color-button-background-dark: var(--tt-palette--b50);
--tt-color-button-text-dark: var(--tt-palette--n95);
}
