export async function downloadHookImage(
  text: string,
  framework: string,
  platform: string,
): Promise<void> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export unavailable');
  const font = '600 48px sans-serif';
  context.font = font;
  const lines: string[] = [];
  let line = '';
  // Wrap by character as well as whitespace, including long words and Hindi text.
  for (const paragraph of text.split('\n')) {
    for (const character of Array.from(paragraph)) {
      if (context.measureText(line + character).width > 904) {
        const space = line.lastIndexOf(' ');
        if (space > line.length / 2) {
          lines.push(line.slice(0, space));
          line = line.slice(space + 1);
        } else {
          lines.push(line);
          line = '';
        }
      }
      line += character;
    }
    lines.push(line);
    line = '';
  }
  canvas.height = Math.max(1080, 440 + lines.length * 68);
  context.fillStyle = '#101214';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f2b84b';
  context.fillRect(88, 88, 64, 6);
  context.font = '24px monospace';
  context.fillText(framework, 88, 155, 904);
  context.fillStyle = '#f3f4f4';
  context.font = font;
  lines.forEach((value, index) =>
    context.fillText(value, 88, 268 + index * 68),
  );
  context.fillStyle = '#87d4cb';
  context.font = '24px sans-serif';
  context.fillText(platform, 88, canvas.height - 148);
  context.fillStyle = '#a9afb5';
  context.font = '22px sans-serif';
  context.fillText('Made with HookLab.AI', 88, canvas.height - 88);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error('Image export failed')),
      'image/png',
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hooklab-hook.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
