import json
import re

with open('output.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cards_html = ''
for card in data['cards']:
    cards_html += f'''              <a class="card horz" href="post.html">
                <figure>
                  <img src="{card['img']}" alt="">
                </figure>
                <div>
                  <u>{card['subtitle']}</u>
                  <span>{card['title']}</span>
                </div>
              </a>\n'''

blogs_html = ''
for blog in data['blogs']:
    blogs_html += f'''                <li>
                  <a href="post.html">
                    <span>{blog['title']}</span>
                    <time datetime="{blog['time'].replace('.', '-')}">{blog['time']}</time>
                  </a>
                </li>\n'''

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cards inside writing section
content = re.sub(r'(<section class="writing">\s*<header>.*?</header>\s*<div>).*?(</div>\s*</section>)', r'\g<1>\n' + cards_html + r'\g<2>', content, flags=re.DOTALL)
# Replace blogs inside blogposts list
content = re.sub(r'(<ul class="blogposts">).*?(</ul>)', r'\g<1>\n' + blogs_html + r'\g<2>', content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

css_append = '''

/* --- Fix for Newsletter Form --- */
.newsletter .form-control {
    background-color: #2b2b2b !important;
    border: 1px solid #1a233a !important;
    border-radius: 4px;
    padding: 10px 14px;
    font-size: 1rem;
    color: #ccc;
    font-family: var(--font-sans);
    line-height: 1.5;
    outline: none;
    width: 300px;
    max-width: 100%;
}
.newsletter .form-control:focus {
    border-color: #0d4a7a !important;
    box-shadow: 0 0 0 2px rgba(13, 74, 122, 0.4);
}
.newsletter .btn {
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 1rem;
    font-family: var(--font-sans);
    border: none;
    cursor: pointer;
    font-weight: 500;
}
@media (min-width: 45rem) {
    .newsletter .main-form {
        flex-direction: row;
        align-items: stretch;
    }
}
'''
with open('index.css', 'a', encoding='utf-8') as f:
    f.write(css_append)
