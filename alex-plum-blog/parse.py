import html.parser

class MyHTMLParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.skip = False
        
    def handle_starttag(self, tag, attrs):
        if self.skip: return
        if tag in ('head', 'style', 'script'): 
            self.skip = True
            return
            
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '')
        id_ = attrs_dict.get('id', '')
        
        print('  ' * self.depth + f'<{tag} class="{classes}" id="{id_}">')
        if tag not in ('img', 'br', 'hr', 'meta', 'link', 'input'):
            self.depth += 1
            
    def handle_endtag(self, tag):
        if tag in ('head', 'style', 'script'): 
            self.skip = False
            return
        if self.skip: return
        
        if tag not in ('img', 'br', 'hr', 'meta', 'link', 'input'):
            self.depth -= 1
        print('  ' * self.depth + f'</{tag}>')

def main():
    try:
        with open(r'D:\Desktop\Frank Chimero\Frank Chimero · Home.html', encoding='utf-8') as f:
            content = f.read()
        MyHTMLParser().feed(content)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
