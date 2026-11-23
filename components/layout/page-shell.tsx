import { Header } from "./header";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Standard scrollable content page with a header. */
export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <>
      <Header title={title} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          {(description || actions) && (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
