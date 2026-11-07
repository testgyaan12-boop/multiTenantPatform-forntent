import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, type RenderResult } from '@testing-library/react';
import { AppProviders } from '@/app/providers';

interface RenderOptions {
  path: string;
  route?: string;
}

export function renderPage(ui: ReactElement, { path, route }: RenderOptions): RenderResult {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[route ?? path]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}
