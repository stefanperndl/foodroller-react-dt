import { fetchMealsByCategory, fetchMealById } from '../api/recipes';

beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => jest.clearAllMocks());

const mockFetch = (data) =>
  global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });

describe('fetchMealsByCategory', () => {
  it('returns normalised meal objects', async () => {
    mockFetch({
      meals: [{ idMeal: '1', strMeal: 'Pasta', strMealThumb: 'pasta.jpg', strCategory: 'Pasta' }],
    });
    const result = await fetchMealsByCategory('Pasta');
    expect(result).toEqual([{ id: '1', name: 'Pasta', image: 'pasta.jpg', category: 'Pasta' }]);
  });

  it('returns empty array when API returns null meals', async () => {
    mockFetch({ meals: null });
    const result = await fetchMealsByCategory('Unknown');
    expect(result).toEqual([]);
  });
});

describe('fetchMealById', () => {
  const apiMeal = {
    idMeal: '42',
    strMeal: 'Chicken Tikka',
    strMealThumb: 'tikka.jpg',
    strCategory: 'Chicken',
    strArea: 'Indian',
    strInstructions: 'Cook it.',
    strTags: 'Spicy,Healthy',
    strIngredient1: 'chicken',
    strIngredient2: 'yogurt',
    strIngredient3: '',
    strMeasure1: '500g',
    strMeasure2: '2 tbs',
    strMeasure3: '',
  };

  it('returns a full recipe with combined ingredient strings', async () => {
    mockFetch({ meals: [apiMeal] });
    const result = await fetchMealById('42');
    expect(result.id).toBe('42');
    expect(result.name).toBe('Chicken Tikka');
    expect(result.ingredients).toContain('500g chicken');
    expect(result.ingredients).toContain('2 tbs yogurt');
  });

  it('strips empty ingredient entries', async () => {
    mockFetch({ meals: [apiMeal] });
    const result = await fetchMealById('42');
    // ingredient3 is empty — should not appear
    expect(result.ingredients).toHaveLength(2);
  });

  it('parses tags into an array', async () => {
    mockFetch({ meals: [apiMeal] });
    const result = await fetchMealById('42');
    expect(result.tags).toEqual(['Spicy', 'Healthy']);
  });

  it('returns empty tags array when strTags is null', async () => {
    mockFetch({ meals: [{ ...apiMeal, strTags: null }] });
    const result = await fetchMealById('42');
    expect(result.tags).toEqual([]);
  });
});
