from bs4 import BeautifulSoup

def parse_html_to_js(html):
    soup = BeautifulSoup(html, 'html.parser')
    
    js_code = []
    unnamed_counter = 0
    # Recursive function to generate JS code
    def generate_js(element, parent_id=None):
        nonlocal unnamed_counter
        if element.name:
            # Initialize element ID as a hashed version by default
            element_id = element.attrs.get('id', f"__{unnamed_counter}")
            unnamed_counter += 1

            textContent = None
            if element.string:
                textContent = element.string.strip()

            if textContent and textContent.startswith("#"):
                return #skip this element with text starting with "#"

            # Check if the element contains a special span with text starting with "#"
            for child in element.children:
                if child.string and child.string.strip().startswith("#"):
                    # Handle #@ differently from #
                    special_identifier = child.string.strip()[1:]  # Extract and strip the "#"
                    if special_identifier.startswith("@"):
                        # Hide the entire element containing #@
                        return

                    # Set the element ID to the special identifier
                    element_id = special_identifier
                    child.extract()  # Remove the span element from the tree
                    break  # Only one span with a "#" is relevant

            # Create the element in JS
            js_code.append(f'let {element_id} = document.createElement("{element.name}");\n')

            # Add attributes immediately after creation
            for attr, value in element.attrs.items():
                if isinstance(value, list):
                    value = " ".join(value)
                js_code.append(f'{element_id}.setAttribute("{attr}", "{value}");\n')

            # Add text if it's not a tag
            if textContent:
                js_code.append(f'{element_id}.textContent = `{element.string.strip()}`;\n')

            # Append this element to its parent if parent exists
            if parent_id:
                js_code.append(f'{parent_id}.appendChild({element_id});\n')
            else:
                # If there's no parent, append it to document.body
                js_code.append(f'document.body.appendChild({element_id});\n')

            js_code.append(f'\n')

            # Process children recursively
            for child in element.children:
                if child.name:  # Only process tags, not text nodes
                    generate_js(child, element_id)

            return element_id
        return None

    # Start from the body and generate the JS code
    body = soup.body
    if body:
        # Process direct children of <body> and append them to document.body
        for child in body.children:
            if child.name:
                generate_js(child)

    return ''.join(js_code)

# Read the input HTML file with UTF-8 encoding
with open('index.html', 'r', encoding='utf-8') as file:
    html = file.read()

# Generate the JS code
generated_js = parse_html_to_js(html)

# Load the original HTML and replace body with a script tag containing the JS code
soup = BeautifulSoup(html, 'html.parser')

# Replace body content with script
soup.body.clear()  # Remove current body contents
script_tag = soup.new_tag('script')
script_tag.string = generated_js
soup.body.append(script_tag)

# Write the modified HTML to a new file with UTF-8 encoding
with open('packed.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Packed HTML file with JS has been created: packed.html")
