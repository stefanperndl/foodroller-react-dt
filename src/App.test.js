import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
beforeAll(() => {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			json: () => Promise.resolve({ categories: [] }),
		})
	);
});

afterAll(() => {
	global.fetch.mockRestore && global.fetch.mockRestore();
});

describe('App', () => {
	it('renders without crashing', () => {
		render(<App />);
	});
});
