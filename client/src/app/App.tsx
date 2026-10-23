import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { ThemeProvider } from '../theme/theme.tsx';
import { createQueryClient } from './query-client.ts';
import { router } from './router.tsx';

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
