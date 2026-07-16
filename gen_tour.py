import json, sys

DEST_MAP = {
    "Hanoi": "hanoi.html", "Ha Long Bay": "ha-long-bay.html", "Ninh Binh": "ninh-binh.html",
    "Sapa": "sapa.html", "Ha Giang": "ha-giang.html", "Pu Luong": "pu-luong.html",
    "Phong Nha": "phong-nha.html", "Hue": "hue.html", "Hoi An": "hoi-an.html",
    "Siem Reap": "siem-reap.html", "Ho Chi Minh City": "hcmc.html", "Mekong Delta": "mekong-delta.html",
    "Mui Ne": "mui-ne.html", "Da Nang": "da-nang.html", "Cao Bang": "cao-bang.html",
    "Mu Cang Chai": "mu-cang-chai.html",
}

CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
CROSS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
CLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
MAP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20l-5.5 2.5V6.5L9 4m0 16l6 2m-6-2V4m6 18l5.5-2.5V3.5L15 6m0 16V4m0 2L9 4"/></svg>'
STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/></svg>'
BED_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18v2M21 18v2M3 13h18"/><circle cx="7" cy="9" r="1.5"/></svg>'


def route_line(route):
    return " ".join(f"<span>{r}</span>" for r in route)


def route_chips(route):
    out = []
    for r in route:
        href = DEST_MAP.get(r)
        if href:
            out.append(f'<a href="../destinations/{href}" class="tour-route-chip">{MAP_SVG} {r}</a>')
        else:
            out.append(f'<span class="tour-route-chip">{MAP_SVG} {r}</span>')
    return "\n            ".join(out)


def highlights_html(items):
    return "\n            ".join(f'<li>{CHECK_SVG}{h}</li>' for h in items)


def itinerary_html(days):
    out = []
    for i, d in enumerate(days):
        open_attr = " open" if i == 0 else ""
        out.append(f'''<details class="itinerary-day"{open_attr}>
            <summary><span class="itinerary-day-num">{d["day"]}</span><h4>{d["title"]}</h4>{CHEVRON_SVG}</summary>
            <div class="itinerary-day-body"><p>{d["desc"]}</p></div>
          </details>''')
    return "\n          ".join(out)


def accommodation_html(rows):
    out = []
    for r in rows:
        out.append(f'<div class="accommodation-row"><span>{r["location"]}</span><strong>{r["hotel"]}</strong></div>')
    return "\n          ".join(out)


def incl_excl_html(inclusions, exclusions):
    incl = "\n              ".join(f'<li>{CHECK_SVG}{i}</li>' for i in inclusions)
    excl = "\n              ".join(f'<li>{CROSS_SVG}{e}</li>' for e in exclusions)
    return incl, excl


def notes_html(notes):
    return "\n            ".join(f'<li>{CHECK_SVG}{n}</li>' for n in notes)


def build(data):
    route = data["route"]
    days = data["itinerary"]

    incl, excl = incl_excl_html(data["inclusions"], data["exclusions"])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script>document.documentElement.classList.add('js');</script>
  <title>{data["name"]} | Navigator Vietnam</title>
  <meta name="description" content="{data["meta_desc"]}" />
  <link rel="icon" href="../assets/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css?v=29" />
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header class="site-header scrolled">
    <div class="container nav">
      <a href="../index.html" class="nav-logo" aria-label="Navigator Vietnam home">
        <img src="../assets/logo.png" alt="Navigator Vietnam" width="160" height="42" />
      </a>
      <nav class="nav-links" aria-label="Primary">
        <a href="../index.html">Home</a>
        <a href="../about.html">About</a>
        <a href="../tours.html" class="active">Tours</a>
        <a href="../contact.html">Contact</a>
      </nav>
      <a href="../contact.html?tour={data["slug"]}" class="btn btn-primary nav-cta">
        Plan Your Trip
        <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </header>

  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-top">
      <button class="mobile-menu-close" aria-label="Close menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
    <nav class="mobile-menu-links" aria-label="Mobile">
      <a href="../index.html">Home</a>
      <a href="../about.html">About</a>
      <a href="../tours.html">Tours</a>
      <a href="../contact.html">Contact</a>
    </nav>
    <a href="../contact.html?tour={data["slug"]}" class="btn btn-accent">Plan Your Trip</a>
  </div>

  <main id="main">

    <!-- ===================== TOUR HERO (photo) ===================== -->
    <section class="page-hero dest-hero has-photo">
      <img src="{data["hero_img"]}" alt="{data["hero_alt"]}" class="dest-hero-bg" fetchpriority="high" />
      <div class="dest-hero-overlay"></div>
      <div class="container">
        <span class="breadcrumb reveal"><a href="../index.html">Home</a> / <a href="../tours.html">Tours</a> / {data["name"]}</span>
        <h1 class="reveal">{data["name"]}</h1>
        <div class="dest-hero-divider reveal"></div>
        <p class="page-hero-lead dest-hero-lead reveal">{data["tagline"]}</p>
        <div class="tour-route-line reveal">{route_line(route)}</div>
      </div>
    </section>

    <!-- ===================== CONTENT + SIDEBAR ===================== -->
    <section class="section">
      <div class="container dest-layout">

        <div class="dest-content reveal">
          <h2>Overview</h2>
          <p>{data["overview"]}</p>

          <h2>Tour Highlights</h2>
          <ul>
            {highlights_html(data["highlights"])}
          </ul>

          <h2>Itinerary</h2>
          <div class="itinerary-list">
          {itinerary_html(days)}
          </div>

          <h2>Accommodation</h2>
          <div class="accommodation-list">
          {accommodation_html(data["accommodation"])}
          </div>

          <h2>Inclusions &amp; Exclusions</h2>
          <div class="incl-excl-grid">
            <div class="incl-excl-col">
              <h4>Included</h4>
              <ul class="incl-list">
              {incl}
              </ul>
            </div>
            <div class="incl-excl-col">
              <h4>Not Included</h4>
              <ul class="excl-list">
              {excl}
              </ul>
            </div>
          </div>

          <h2>Travel Notes</h2>
          <ul>
            {notes_html(data["travel_notes"])}
          </ul>

          <div class="tour-flex-note reveal">
            <h3>Flexible Travel</h3>
            <p>{data["flexible_note"]}</p>
          </div>

          <a href="../contact.html?tour={data["slug"]}" class="btn btn-primary dest-content-cta">
            Enquire About This Tour
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>

        <aside class="dest-sidebar reveal">
          <div class="adv-card tour-quickfacts">
            <h3>Quick Facts</h3>
            <div class="tour-fact-list">
              <div class="tour-fact-row">{CLOCK_SVG}<div><small>Duration</small><strong>{data["duration"]}</strong></div></div>
              <div class="tour-fact-row">{MAP_SVG}<div><small>Style</small><strong>{data["style"]}</strong></div></div>
              <div class="tour-fact-row">{STAR_SVG}<div><small>Activity Level</small><strong>{data["activity_level"]}</strong></div></div>
              <div class="tour-fact-row">{BED_SVG}<div><small>Accommodation</small><strong>{data["accommodation_style"]}</strong></div></div>
            </div>
            <div class="adv-card-foot">
              <a href="../contact.html?tour={data["slug"]}" class="btn btn-primary">Enquire Now</a>
            </div>
          </div>

          <div style="margin-top:28px;">
            <h3 style="font-size:1.05rem;margin-bottom:4px;">The Route</h3>
            <div class="tour-route-chips">
            {route_chips(route)}
            </div>
          </div>
        </aside>

      </div>
    </section>

  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="../index.html" class="footer-logo"><img src="../assets/logo.png" alt="Navigator Vietnam" width="140" height="38" /></a>
          <p>We specialize in a diverse range of tours designed to cater to every traveler's desires. Join us and let us chart the course for your next adventure.</p>
          <div class="footer-social">
            <a href="https://www.facebook.com" aria-label="Navigator Vietnam on Facebook" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg></a>
            <a href="https://www.instagram.com" aria-label="Navigator Vietnam on Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
            <a href="https://wa.me/8433547584" aria-label="Navigator Vietnam on WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm5.7 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5s.7 1.7.8 1.8c.1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.5.6-.2.2-.4.4-.2.8.2.4.9 1.5 2 2.4 1.3 1.2 2.4 1.6 2.8 1.7.4.2.6.1.8-.1.2-.3.7-.9.9-1.2.2-.3.4-.2.7-.1.3.1 1.7.8 2 1 .3.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="../index.html">Home</a></li>
            <li><a href="../about.html">About Us</a></li>
            <li><a href="../tours.html">Tours</a></li>
            <li><a href="../contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="../terms-conditions.html">Terms &amp; Conditions</a></li>
            <li><a href="../privacy-policy.html">Privacy Policy</a></li>
          </ul>
        </div>
        <div class="footer-col footer-contact">
          <h4>Get in Touch</h4>
          <ul>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg><span>La Grace 5, 34 Ng&otilde; 20 P. Qu&#7843;ng Kh&aacute;nh, H&agrave; N&#7897;i</span></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8 10a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z"/></svg><a href="tel:+84335472584">+84 33 547 2584</a></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg><a href="mailto:info@navigator-vietnam.com">info@navigator-vietnam.com</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 Navigator Vietnam. All Rights Reserved.</span>
        <span>Designed by Edweb Media</span>
      </div>
    </div>
  </footer>

  <a href="https://wa.me/8433547584?text=Hi%20Navigator%20Vietnam%2C%20I%27d%20like%20to%20plan%20a%20trip!" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat with Navigator Vietnam on WhatsApp">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm5.7 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5s.7 1.7.8 1.8c.1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.5.6-.2.2-.4.4-.2.8.2.4.9 1.5 2 2.4 1.3 1.2 2.4 1.6 2.8 1.7.4.2.6.1.8-.1.2-.3.7-.9.9-1.2.2-.3.4-.2.7-.1.3.1 1.7.8 2 1 .3.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>
  </a>

  <script src="../script.js?v=29"></script>
</body>
</html>
'''


if __name__ == '__main__':
    sys.stdin.reconfigure(encoding='utf-8')
    data = json.loads(sys.stdin.read())
    out_path = sys.argv[1]
    html_out = build(data)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html_out)
    print('written', out_path, len(html_out))
