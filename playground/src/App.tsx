import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import { History, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { cn } from 'cn';
import { IconButton } from '@/components/icon-button';
import { JsonEditor } from '@/components/json-editor';
import { RemoteTypesHelp } from '@/components/remote-types-help';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHistory, type HistoryEntry } from '@/lib/history';
import { useMediaQuery } from '@/lib/media';
import { resolve, type Resolution } from '@/lib/resolve';
import { defaultConfig, samples } from '@/lib/samples';
import { storage, storageKeys } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

const repositoryUrl = 'https://github.com/xianghongai/git-meta-up';

const initial: Resolution = {
  output: { hint: 'Paste a clone URL or any repository page, or pick a sample.' },
  links: [],
};

export const App = () => {
  const { theme, toggle } = useTheme();
  const desktop = useMediaQuery('(min-width: 64rem)');
  const history = useHistory();
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState(() => storage.read(storageKeys.config) ?? defaultConfig);
  const [result, setResult] = useState<Resolution>(initial);

  const run = useCallback(
    (input: string, configText: string) => {
      const value = input.trim();
      if (!value) {
        return;
      }
      const resolution = resolve(value, configText);
      setResult(resolution);
      if (!resolution.configError) {
        history.remember({
          url: value,
          config: configText,
          ...(resolution.provider ? { provider: resolution.provider } : {}),
          time: new Date().toISOString(),
        });
      }
    },
    [history]
  );

  const changeConfig = (value: string) => {
    setConfig(value);
    storage.write(storageKeys.config, value);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(url, config);
  };

  const restore = (entry: HistoryEntry) => {
    setUrl(entry.url);
    changeConfig(entry.config);
    run(entry.url, entry.config);
  };

  const inputs: ReactNode = (
    <>
      <Card size="sm" className="shrink-0">
        <CardHeader>
          <CardTitle>Remote</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form className="flex gap-2 max-sm:flex-col" onSubmit={submit}>
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste a clone URL or any repository page, e.g. https://github.com/owner/repo/blob/main/README.md"
              aria-label="Remote URL"
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
            />
            <Button type="submit">Parse</Button>
          </form>
          <div className="flex flex-wrap gap-1.5" aria-label="Samples">
            {samples.map((sample) => (
              <Button
                key={sample.label}
                type="button"
                size="xs"
                variant="outline"
                title={sample.url}
                className={cn('rounded-full', sample.config && 'border-dashed bg-transparent')}
                onClick={() => {
                  setUrl(sample.url);
                  run(sample.url, config);
                }}
              >
                {sample.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className={cn('shrink-0', desktop && 'min-h-48 flex-1 shrink')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Remote config
            <RemoteTypesHelp />
          </CardTitle>
          <CardDescription>
            Self-hosted domains, in the same shape as GitLens <code className="font-mono">gitlens.remotes</code>.
          </CardDescription>
          <CardAction>
            <IconButton label="Reset to the example config" onClick={() => changeConfig(defaultConfig)}>
              <RotateCcw />
            </IconButton>
          </CardAction>
        </CardHeader>
        {/* Desktop: the config card takes the rest of the upper panel and the editor fills it. */}
        <CardContent className={cn('flex flex-col gap-2', desktop && 'min-h-0 flex-1')}>
          <JsonEditor
            label="Remote config"
            value={config}
            theme={theme}
            onChange={changeConfig}
            className={desktop ? 'min-h-0 flex-1' : 'h-36'}
          />
          {result.configError && (
            <p role="alert" className="text-xs text-destructive">
              {result.configError}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );

  const historyCard: ReactNode = (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>Kept in this browser. Select one to parse it again.</CardDescription>
        <CardAction>
          <IconButton label="Clear history" disabled={history.entries.length === 0} onClick={history.clear}>
            <Trash2 />
          </IconButton>
        </CardAction>
      </CardHeader>
      <CardContent className="max-lg:max-h-80 lg:min-h-0 lg:flex-1">
        {history.entries.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="size-4" />
            No parsed remotes yet.
          </p>
        ) : (
          <ScrollArea className="h-full max-lg:h-80">
            <ol className="flex flex-col gap-0.5 pr-3">
              {history.entries.map((entry) => (
                <li key={`${entry.time}:${entry.url}`}>
                  <button
                    type="button"
                    onClick={() => restore(entry)}
                    className="grid w-full grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Badge variant={entry.provider ? 'secondary' : 'destructive'} className="justify-self-start">
                      {entry.provider ?? 'Unrecognized'}
                    </Badge>
                    <span className="truncate font-mono text-xs" title={entry.url}>
                      {entry.url}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  return (
    // Desktop: one screen, each panel scrolls inside itself. Narrow screens stack the panels and scroll the page.
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="flex shrink-0 items-center gap-2 text-lg font-semibold">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-6" />
            git-meta-up
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            Resolve a Git remote or repository page to its hosting provider and build links to its web pages.
          </p>
        </div>
        {/* Well-known icons: an accessible name is enough, no tooltip. */}
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <SiGithub />
          </a>
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggle}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {desktop ? (
          // Desktop: the inputs and the history share the left column; drag the handle to resize them.
          <ResizablePanelGroup orientation="vertical" className="min-h-0">
            <ResizablePanel defaultSize="50%" minSize="25%">
              <div className="flex h-full flex-col gap-4 overflow-y-auto pb-2">{inputs}</div>
            </ResizablePanel>
            <ResizableHandle withHandle className="my-1" />
            <ResizablePanel defaultSize="50%" minSize="20%">
              <div className="h-full pt-2">{historyCard}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {inputs}
            {historyCard}
          </div>
        )}

        <Card size="sm" className="min-w-0 lg:min-h-0">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>The parsed remote and the links built from it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
            {result.links.length > 0 && (
              <ScrollArea className="max-h-72 shrink-0 rounded-md border">
                <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 p-3 text-xs">
                  {result.links.map(([kind, href]) => (
                    <div key={kind} className="contents">
                      <dt className="text-muted-foreground">{kind}</dt>
                      <dd className="font-mono break-all">
                        {/^https?:\/\//i.test(href) ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {href}
                          </a>
                        ) : (
                          // An SSH clone URL is not a web page: show it as text to copy.
                          <span className="select-all">{href}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </ScrollArea>
            )}
            <JsonEditor
              label="Result"
              value={`${JSON.stringify(result.output, null, 2)}\n`}
              theme={theme}
              className="h-96 lg:h-auto lg:min-h-0 lg:flex-1"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
