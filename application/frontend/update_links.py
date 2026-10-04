import re
path = r'c:\Users\Bartlomiej\Documents\Praca inzynierska\application\frontend\index.html'

with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Zmiana linku Moje Rezerwacje (replace href="#" to href="reservations.html")
html = re.sub(
    r'(<a[^>]*?)href="#"([^>]*?><span class="material-symbols-outlined text-\[18px\]">event_available</span><span class="font-body-sm text-body-sm">Moje Rezerwacje</span>)',
    r'\1href="reservations.html"\2',
    html
)

# Zmiana linku Rezerwacja Biurka
html = re.sub(
    r'(<a[^>]*?)href="#"([^>]*?><span class="material-symbols-outlined text-\[18px\]">desk</span><span class="font-body-sm text-body-sm">Rezerwacja Biurka</span>)',
    r'\1href="/"\2',
    html
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated successfully")
