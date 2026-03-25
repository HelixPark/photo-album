from PIL import Image, ImageDraw
import os

colors = [(70, 130, 200), (200, 100, 70), (70, 180, 100)]
for i, color in enumerate(colors):
    img = Image.new('RGB', (800, 600), color=color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 750, 550], outline='white', width=4)
    draw.text((400, 300), f'Test Photo {i+1}', fill='white')
    path = f'/Users/meitaun_park/Desktop/gstack/photo-album/test_photo_{i+1}.jpg'
    img.save(path, 'JPEG')
    print(f'Created: {path}')
