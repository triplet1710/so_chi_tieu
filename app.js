const KEY = 'chi-tieu';
const $ = (id) => document.getElementById(id);
const money = (n) => n.toLocaleString('vi-VN') + ' ₫';

let items = JSON.parse(localStorage.getItem(KEY) || '[]');

function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
  render();
}

function render() {
  const now = new Date();
  const total = items
    .filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + item.amount, 0);
  $('total').textContent = money(total);

  const list = $('list');
  list.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Chưa có khoản chi nào';
    list.append(empty);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');

    const info = document.createElement('div');
    info.className = 'info';
    const title = document.createElement('div');
    title.textContent = `${item.name}: ${money(item.amount)}`;
    const date = document.createElement('div');
    date.className = 'date';
    date.textContent = new Date(item.date).toLocaleDateString('vi-VN');
    info.append(title, date);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Xóa';
    remove.onclick = () => {
      if (!confirm(`Xóa "${item.name}"?`)) return;
      items = items.filter((other) => other.id !== item.id);
      save();
    };

    li.append(info, remove);
    list.append(li);
  }
}

$('form').addEventListener('submit', (event) => {
  event.preventDefault();
  // Bỏ dấu chấm, phẩy để nhập "35.000" cũng hiểu là 35000
  const amount = Number($('amount').value.replace(/[.,\s]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Số tiền không hợp lệ');
    return;
  }
  items.unshift({
    id: Date.now(),
    name: $('name').value.trim(),
    amount,
    date: new Date().toISOString(),
  });
  save();
  event.target.reset();
});

$('export').addEventListener('click', async () => {
  const name = `chi-tieu-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(items, null, 2)], name, { type: 'application/json' });

  // Trên iPhone mở bảng Chia sẻ để lưu vào app Tệp; máy tính thì tải file xuống
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch (error) {
      if (error.name !== 'AbortError') alert('Không xuất được: ' + error.message);
    }
    return;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
});

$('import').addEventListener('click', () => $('file').click());

$('file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const valid = Array.isArray(data) && data.every((item) =>
      item.id && typeof item.name === 'string' && Number.isFinite(item.amount)
      && typeof item.date === 'string' && !Number.isNaN(Date.parse(item.date)));
    if (!valid) throw new Error('sai định dạng');
    if (!confirm(`Thay dữ liệu hiện tại bằng ${data.length} khoản trong file backup?`)) return;
    items = data;
    save();
  } catch (error) {
    alert('File backup không đọc được: ' + error.message);
  }
});

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
