import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const TiptapEditor = lazy(() => import('./TiptapEditor').then(module => ({ default: module.TiptapEditor })));

const LazyTiptapEditor = (props) => {
  return (
    <Suspense
      fallback={
        <div className="flex h-[250px] w-full items-center justify-center rounded-md border">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TiptapEditor {...props} />
    </Suspense>
  );
};

export default LazyTiptapEditor;
