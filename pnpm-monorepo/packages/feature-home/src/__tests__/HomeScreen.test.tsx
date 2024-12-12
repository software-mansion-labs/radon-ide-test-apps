import { cleanup, render, screen } from '@testing-library/react-native';

import { HomeScreen } from '../HomeScreen';

afterEach(cleanup);

it('says PNPM monorepo', () => {
  render(<HomeScreen />);
  expect(screen.getByText('PNPM monorepo')).toBeDefined();
});
