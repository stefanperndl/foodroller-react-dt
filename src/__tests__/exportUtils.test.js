import { copyToClipboard, exportCSV, printList } from '../utils/exportUtils';

const sampleIngredients = [
  { name: 'chicken', qty: 500, unit: 'g', meals: ['Tikka Masala'] },
  { name: 'olive oil', qty: 2, unit: 'tbs', meals: ['Tikka Masala', 'Greek Salad'] },
  { name: 'egg', qty: 3, unit: '', meals: ['Omelette'] },
];

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('writes formatted text to clipboard', async () => {
    await copyToClipboard(sampleIngredients);
    const written = navigator.clipboard.writeText.mock.calls[0][0];
    expect(written).toMatch('Shopping List');
    expect(written).toMatch('500 g chicken');
    expect(written).toMatch('Tikka Masala');
    expect(written).toMatch('3 egg');
  });
});

describe('exportCSV', () => {
  let createdUrl;
  beforeEach(() => {
    createdUrl = 'blob:mock';
    global.URL.createObjectURL = jest.fn(() => createdUrl);
    global.URL.revokeObjectURL = jest.fn();
    const mockAnchor = { href: '', download: '', click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
  });

  afterEach(() => jest.restoreAllMocks());

  it('triggers a CSV download with correct filename', () => {
    exportCSV(sampleIngredients);
    const anchor = document.createElement.mock.results[0].value;
    expect(anchor.download).toBe('shopping-list.csv');
    expect(anchor.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(createdUrl);
  });

  it('includes a header row and one row per ingredient', () => {
    const blobContents = [];
    global.Blob = class {
      constructor(parts) { blobContents.push(parts[0]); }
    };
    exportCSV(sampleIngredients);
    const csv = blobContents[0];
    expect(csv).toMatch('Ingredient,Quantity,Unit,Used In');
    expect(csv).toMatch('"chicken"');
    expect(csv).toMatch('"500"');
    expect(csv).toMatch('"Tikka Masala"');
  });
});

describe('printList', () => {
  it('calls window.print', () => {
    global.print = jest.fn();
    printList();
    expect(global.print).toHaveBeenCalled();
  });
});
