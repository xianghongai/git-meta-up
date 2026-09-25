import { CircleHelp } from 'lucide-react';
import { gitProviderTypes, type GitProviderType } from 'git-meta-up';
import { buttonVariants } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

/** How each provider type is recognized; typed by GitProviderType so a new type cannot be left out. */
const recognition: Record<GitProviderType, string> = {
  GitHub: 'github.com',
  GitLab: 'gitlab.com',
  Gitea: 'gitea.com, codeberg.org',
  Bitbucket: 'bitbucket.org',
  BitbucketServer: '/scm/… or /projects/…/repos/… paths',
  AzureDevOps: 'dev.azure.com, *.visualstudio.com, /_git/ paths',
  Gitee: 'gitee.com',
  CNB: 'cnb.cool',
  Codeup: 'codeup.aliyun.com',
  Custom: 'your own urls templates',
};

/** Help for the remote config: the `type` values and what each one is recognized by without a config. */
export const RemoteTypesHelp = () => (
  <HoverCard>
    <HoverCardTrigger
      render={
        <button
          type="button"
          aria-label="Supported types"
          className={buttonVariants({ variant: 'ghost', size: 'icon-xs', className: 'text-muted-foreground' })}
        />
      }
    >
      <CircleHelp />
    </HoverCardTrigger>
    <HoverCardContent side="right" align="start" className="w-max max-w-[calc(100vw-2rem)]">
      {/* Width follows the content: every line stays on one line. */}
      <div className="flex flex-col gap-2 text-xs whitespace-nowrap">
        <p className="text-sm font-medium">Supported types</p>
        <p className="text-muted-foreground">
          Set <code className="font-mono">type</code> for a self-hosted <code className="font-mono">domain</code>.
          <br />
          Recognized without a config:
        </p>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          {gitProviderTypes.map((type) => (
            <div key={type} className="contents">
              <dt className="font-mono">{type}</dt>
              <dd className="text-muted-foreground">{recognition[type]}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground">
          Other fields: <code className="font-mono">name</code>, <code className="font-mono">protocol</code>, and{' '}
          <code className="font-mono">urls</code> for Custom.
        </p>
      </div>
    </HoverCardContent>
  </HoverCard>
);
