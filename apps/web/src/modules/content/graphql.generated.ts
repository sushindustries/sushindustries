import type { GraphQLResolveInfo } from 'graphql';
import type { ReferenceProvider as ReferenceProviderRow, ReferencePage as ReferencePageRow } from '@sushindustries/db/schema';
import type { ShapedElement, ElementShard as ElementShardModel } from './elements.server';
import type { RepositorySummary } from './github.server';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/**
 * What this API is, and whether what you hold is still what it serves.
 *
 * `version` moves when the shape changes and is the thing to check against a
 * client. `revision` moves whenever any file does: it is a hash over every
 * document's `sha`, so an edit anywhere changes it and nothing else does. A
 * caller that remembers the last revision it saw can tell in one cheap call
 * whether anything is worth re-reading, which is the question a cache actually
 * has.
 */
export type ApiVersion = {
  /** How many documents went into the revision. */
  documents: Scalars['Int']['output'];
  /**
   * A hash over every document's content hash.
   *
   * Same input, same value - so equal means nothing has been edited, and
   * different means something has, without saying what. `changedSince` is the
   * call that says what.
   */
  revision: Scalars['String']['output'];
  /** When the projection this revision describes was written. */
  syncedAt?: Maybe<Scalars['String']['output']>;
  /** Semantic, and bumped by hand when a field changes meaning or leaves. */
  version: Scalars['String']['output'];
};

/** A saved query over the documents index, and what it currently matches. */
export type Collection = {
  /** The prose explaining why these belong together. Never the members. */
  body: Scalars['String']['output'];
  /** Its slug, and the name of the file that defines it. */
  id: Scalars['String']['output'];
  /** The filter itself, so a client can see what it is asking rather than trust the name. */
  kind?: Maybe<DocumentKind>;
  /** The first `limit` matches, in the collection's own order. */
  members: Array<CollectionMember>;
  search?: Maybe<Scalars['String']['output']>;
  section?: Maybe<Scalars['String']['output']>;
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  /**
   * What the whole collection costs to read.
   *
   * The number to check before reading one: "the conventions is 14,000 tokens"
   * is an answer you can act on, where a list of forty paths is not.
   */
  tokens: Scalars['Int']['output'];
  /** How many documents match. The whole set, never the page. */
  total: Scalars['Int']['output'];
};

/**
 * A document as a collection sees it: enough to decide, never the body.
 *
 * Not `Document`, deliberately. That type is non-null on `body`, `sha` and
 * `syncedAt` - correct for a document you asked for by path, and wrong here,
 * where fifty members would mean fifty bodies crossing the wire to draw a list
 * of titles. Ask `document(path:)` for the one you want to read.
 */
export type CollectionMember = {
  kind: DocumentKind;
  path: Scalars['String']['output'];
  /** Where it is served, when it is served anywhere. Null for source files. */
  route?: Maybe<Scalars['String']['output']>;
  section?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  /** What this one costs to read, so a member can be chosen on price. */
  tokens: Scalars['Int']['output'];
};

/** A commit on the default branch. */
export type Commit = {
  author?: Maybe<Scalars['String']['output']>;
  committedAt: Scalars['String']['output'];
  sha: Scalars['String']['output'];
  /** The first line of the message. The rest is usually the reasoning. */
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

/** One file in this repository: what it is, what it costs to read, and its text. */
export type Document = {
  /** The text. Check `tokens` before asking for it across a list. */
  body: Scalars['String']['output'];
  kind: DocumentKind;
  /** Repo-relative path. The identity of the row. */
  path: Scalars['String']['output'];
  /** Where the site serves this, if it does. Null for source files. */
  route?: Maybe<Scalars['String']['output']>;
  /** For component pages: index, get-started, guides, api or examples. */
  section?: Maybe<Scalars['String']['output']>;
  /** SHA-256 of the body, so a reader can tell whether its copy is current. */
  sha: Scalars['String']['output'];
  /** The thing this belongs to: `card`, `http`, `adding-things`. */
  slug?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  /** When `sync` last wrote this row. The projection's age, stated. */
  syncedAt: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  /** Estimated at four characters a token. Enough to decide before spending them. */
  tokens: Scalars['Int']['output'];
  words: Scalars['Int']['output'];
};

/** Which catalogue a document came from. SOURCE is code, not prose. */
export enum DocumentKind {
  Collection = 'COLLECTION',
  Component = 'COMPONENT',
  Config = 'CONFIG',
  Desk = 'DESK',
  Graph = 'GRAPH',
  Insight = 'INSIGHT',
  Note = 'NOTE',
  Package = 'PACKAGE',
  Page = 'PAGE',
  Plugin = 'PLUGIN',
  Post = 'POST',
  Repo = 'REPO',
  Skill = 'SKILL',
  Source = 'SOURCE',
  Task = 'TASK',
  Template = 'TEMPLATE'
}

/** One page of documents, and how many there are in total. */
export type DocumentPage = {
  /** True when `offset + limit` has not reached `total`. The thing `documents` cannot tell you. */
  hasMore: Scalars['Boolean']['output'];
  /** What was actually applied, which is not always what was asked for. */
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  rows: Array<Document>;
  /** Every row matching the filter, however few were returned. */
  total: Scalars['Int']['output'];
};

/** One installable thing, and what it is made of. */
export type Element = {
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  kind: ElementKind;
  name: Scalars['String']['output'];
  /**
   * The elements that include this one. The inverse of `parts`.
   *
   * The question "is this referenced by anything" - which is the difference
   * between a component somebody uses and one that was built and forgotten, and
   * is not answerable from the element's own entry.
   */
  partOf: Array<Element>;
  /**
   * The elements this one is built out of, resolved.
   *
   * `nav-bar` is a block, and its parts are the components inside it. Following
   * this is how you find out that installing one thing installs five.
   */
  parts: Array<Element>;
  /** Everything addressable about it, with what each piece costs. */
  shards: Array<ElementShard>;
  subcategory?: Maybe<Scalars['String']['output']>;
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  /**
   * What the whole element costs to read: every shard, added up.
   *
   * The number to check before loading an element into a context window, and
   * the reason `shards` carries costs individually - so you can decide not to.
   */
  tokens: Scalars['Int']['output'];
  /** The ways it can be told to look or behave differently. */
  variants: Array<ElementVariant>;
  /**
   * Its own version, independent of the package's.
   *
   * Bumped when the element's contract changes. It is in every shard address
   * because a copied component has no other version anybody can cite.
   */
  version: Scalars['String']['output'];
};

export enum ElementFacet {
  /** What it needs at runtime: npm packages, and other elements. */
  Deps = 'DEPS',
  /** A documentation section. The only facet that has sections of its own. */
  Docs = 'DOCS',
  /** The files installing it copies in. One shard however many files. */
  Source = 'SOURCE',
  /** The values its props can be switched between. */
  Variants = 'VARIANTS'
}

export enum ElementKind {
  /** An assembly of components that stands as a region of a page. */
  Block = 'BLOCK',
  /** One thing with one job. */
  Component = 'COMPONENT'
}

/** One addressable piece of an element. */
export type ElementShard = {
  facet: ElementFacet;
  /** The address. `/nav-bar/0.1.0/docs/api`. */
  path: Scalars['String']['output'];
  /** For DOCS: index, get-started, guides, api, examples. Null for the rest. */
  section?: Maybe<Scalars['String']['output']>;
  /** Content hash, so a held copy can be checked without being re-fetched. Null for facets computed rather than stored. */
  sha?: Maybe<Scalars['String']['output']>;
  /**
   * What fetching this costs.
   *
   * The number that makes sharding worth doing: it is what tells a client that
   * the answer it wants is four hundred tokens rather than the four thousand it
   * would have paid for the whole element.
   */
  tokens: Scalars['Int']['output'];
};

/** One value a prop can take, and what it is for. */
export type ElementVariant = {
  about: Scalars['String']['output'];
  /** True for the value you get by leaving the prop off. */
  isDefault: Scalars['Boolean']['output'];
  /** The prop this is a value of. `variant`, `tone`, `density`. */
  prop: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** An open pull request. */
export type PullRequest = {
  author?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  draft: Scalars['Boolean']['output'];
  number: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Query = {
  /**
   * What this API is, and whether anything has changed since you last looked.
   *
   * The cheapest call here, and the right first one: compare `revision` against
   * the one you stored, and skip everything else when it matches.
   */
  apiVersion: ApiVersion;
  /**
   * Which documents have a different content hash than the ones you hold.
   *
   * Pass the shas you know about. What comes back is what does not match, which
   * is exactly the set worth re-reading - and an empty list is a definite "you
   * are current" rather than an absence of news.
   */
  changedSince: Array<Document>;
  /**
   * One collection by id, drafts included.
   *
   * Drafts are readable by id and absent from the listing - the same contract a
   * draft post has, so the one you are working on can be opened and nobody
   * finds it by browsing.
   */
  collection?: Maybe<Collection>;
  /** Every collection that is not a draft, largest first. */
  collections: Array<Collection>;
  /** One document, by path or by slug and section. Null when there is none. */
  document?: Maybe<Document>;
  /**
   * The same query, with the numbers that make a truncated answer visible.
   *
   * `documents` clamps silently, which is fine for a lookup and dangerous for a
   * count: a caller cannot tell a full page from a capped one, so a set larger
   * than the cap looks like a smaller set. This returns the total and says
   * whether there is more, which is the difference between "these are the rows"
   * and "these are some of the rows".
   */
  documentPage: DocumentPage;
  /**
   * Documents, narrowed.
   *
   * Every argument is a filter and they combine. Omitting all of them returns
   * the first `limit` rows in path order, which is rarely what anybody wants.
   *
   * **`limit` is clamped to 200 and the list does not say so.** Asking for 500
   * returns 200 with nothing to distinguish it from a set that happened to be
   * that size - which is how I once concluded a component was missing two
   * documentation sections it had. Use `documentPage` when the answer matters;
   * this one is for when you know the set is small.
   */
  documents: Array<Document>;
  /** One element by name. */
  element?: Maybe<Element>;
  /**
   * One shard, resolved from its address.
   *
   * `/nav-bar/0.1.0/docs/api`, or the same without the version to mean whatever
   * is current - which is convenient and is the form to avoid pinning against,
   * for the reason the version exists at all.
   */
  elementShard?: Maybe<ElementShard>;
  /** Every installable element, alphabetically. */
  elements: Array<Element>;
  /**
   * Pages in the mirrored indexes, matched on name, description and section.
   *
   * Narrowing by provider is the difference between one result and forty:
   * unnarrowed this searches every entry.
   */
  findReference: Array<ReferencePage>;
  /** Every mirrored provider, largest first. */
  providers: Array<ReferenceProvider>;
  /**
   * The repository this graph describes, read from GitHub's public API.
   *
   * Null when GitHub cannot be reached or has rate-limited this address,
   * rather than an error: the rest of the graph is local and should still
   * answer when the network does not.
   */
  repository?: Maybe<Repository>;
  /** Which documents mention a phrase, with the line it appeared on. */
  search: Array<SearchHit>;
  /** How the mirrored documentation is divided, and the rule it is divided by. */
  sharding: Sharding;
  /**
   * One skill, by name or by index.
   *
   * Give one or the other. Name wins if both arrive, because a name survives a
   * sync and an index only survives the list it came from.
   */
  skill?: Maybe<Skill>;
  /** Every skill in this repository, by name. */
  skills: Array<Skill>;
  /** Counts and the age of the projection. Cheap, and the right first call. */
  totals: Totals;
};


export type QueryChangedSinceArgs = {
  shas: Array<Scalars['String']['input']>;
};


export type QueryCollectionArgs = {
  id: Scalars['String']['input'];
};


export type QueryDocumentArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
  section?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDocumentPageArgs = {
  kind?: InputMaybe<DocumentKind>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  section?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDocumentsArgs = {
  kind?: InputMaybe<DocumentKind>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  section?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryElementArgs = {
  name: Scalars['String']['input'];
};


export type QueryElementShardArgs = {
  path: Scalars['String']['input'];
};


export type QueryElementsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  kind?: InputMaybe<ElementKind>;
};


export type QueryFindReferenceArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  query: Scalars['String']['input'];
  section?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchArgs = {
  kind?: InputMaybe<DocumentKind>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySkillArgs = {
  index?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/**
 * One page in somebody else's documentation.
 *
 * A citation, not a copy. There is no `body` field and there must not be
 * one: what is kept is enough to know which page answers a question, and
 * the prose stays on the server that wrote it.
 */
export type ReferencePage = {
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  section: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

/** A dependency whose published documentation index is mirrored here. */
export type ReferenceProvider = {
  entries: Scalars['Int']['output'];
  fetchedAt: Scalars['String']['output'];
  /** This provider's pages, optionally narrowed to one section. */
  pages: Array<ReferencePage>;
  /** Set when another provider's index listed this one. */
  parent?: Maybe<Scalars['String']['output']>;
  /** Hostname, dashed. `orm-drizzle-team`. */
  provider: Scalars['String']['output'];
  /** The llms.txt this was cut from. */
  source: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  /** Why this dependency, in this repo. The sentence a lockfile never records. */
  usedFor?: Maybe<Scalars['String']['output']>;
};


/** A dependency whose published documentation index is mirrored here. */
export type ReferenceProviderPagesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  section?: InputMaybe<Scalars['String']['input']>;
};

/**
 * The repository, as GitHub sees it.
 *
 * The counterpart to `Document`: that side is what the files say, this side is
 * what has been happening to them. Joining the two is the point - a component
 * whose page nobody opens and whose source nobody has touched in a year is a
 * different finding from one of those alone.
 */
export type Repository = {
  /** Recent commits on the default branch, newest first. */
  commits: Array<Commit>;
  defaultBranch: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  nameWithOwner: Scalars['String']['output'];
  openIssues: Scalars['Int']['output'];
  /** Open pull requests, newest first. */
  pullRequests: Array<PullRequest>;
  pushedAt: Scalars['String']['output'];
  stars: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  /** Recent workflow runs, newest first. Where a red build shows up. */
  workflowRuns: Array<WorkflowRun>;
};


/**
 * The repository, as GitHub sees it.
 *
 * The counterpart to `Document`: that side is what the files say, this side is
 * what has been happening to them. Joining the two is the point - a component
 * whose page nobody opens and whose source nobody has touched in a year is a
 * different finding from one of those alone.
 */
export type RepositoryCommitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * The repository, as GitHub sees it.
 *
 * The counterpart to `Document`: that side is what the files say, this side is
 * what has been happening to them. Joining the two is the point - a component
 * whose page nobody opens and whose source nobody has touched in a year is a
 * different finding from one of those alone.
 */
export type RepositoryPullRequestsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * The repository, as GitHub sees it.
 *
 * The counterpart to `Document`: that side is what the files say, this side is
 * what has been happening to them. Joining the two is the point - a component
 * whose page nobody opens and whose source nobody has touched in a year is a
 * different finding from one of those alone.
 */
export type RepositoryWorkflowRunsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

/** What a search matched, and where. */
export type SearchHit = {
  document: Document;
  /** The line the phrase appeared on, trimmed. Empty when the title matched. */
  excerpt: Scalars['String']['output'];
};

/** One provider, and how its index is divided. */
export type ShardedProvider = {
  entries: Scalars['Int']['output'];
  provider: Scalars['String']['output'];
  /** Sections the publisher divided their own documentation into. */
  sections: Scalars['Int']['output'];
  /** Files it is stored as. More than `sections` when a section exceeded the limit. */
  shards: Scalars['Int']['output'];
  /** The published index this was cut from. */
  source: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  /** What in this repository it is kept for. */
  usedFor?: Maybe<Scalars['String']['output']>;
};

/** How the reference indexes are sharded, and by what rule. */
export type Sharding = {
  /** Largest first, which is where the sharding is doing any work at all. */
  byProvider: Array<ShardedProvider>;
  entries: Scalars['Int']['output'];
  /**
   * Entries per shard before a section is split.
   *
   * A cap on how much has to be read to answer one question, not a target - most
   * shards are far under it, because a section is the unit and sections are
   * whatever size the publisher made them.
   */
  limit: Scalars['Int']['output'];
  /**
   * Providers that produced at least one shard.
   *
   * Lower than `providers` on Query, deliberately, and the difference is a
   * finding rather than a bug: a provider whose llms.txt fetched cleanly and
   * listed nothing is a provider whose index is broken at their end. Two of
   * them today. They appear in `providers` because they were fetched, and not
   * here because there is nothing to shard.
   */
  providers: Scalars['Int']['output'];
  shards: Scalars['Int']['output'];
};

/** One skill: what an agent is told to do, and what it costs to be told. */
export type Skill = {
  /** The instructions themselves. */
  body: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** Position in the list, from one. Stable within a sync. */
  index: Scalars['Int']['output'];
  /** The `name` from its frontmatter, which is how the runtime addresses it. */
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  tokens: Scalars['Int']['output'];
};

/** Counts, so a caller can tell whether the projection has been synced at all. */
export type Totals = {
  documents: Scalars['Int']['output'];
  providers: Scalars['Int']['output'];
  referencePages: Scalars['Int']['output'];
  /** The newest `syncedAt` across documents. Null when nothing is synced. */
  syncedAt?: Maybe<Scalars['String']['output']>;
};

/** One run of a GitHub Actions workflow. */
export type WorkflowRun = {
  branch?: Maybe<Scalars['String']['output']>;
  /** success, failure, cancelled, skipped - null while it is still running. */
  conclusion?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  startedAt: Scalars['String']['output'];
  /** queued, in_progress or completed. */
  status: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ApiVersion: ResolverTypeWrapper<ApiVersion>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Collection: ResolverTypeWrapper<Collection>;
  CollectionMember: ResolverTypeWrapper<CollectionMember>;
  Commit: ResolverTypeWrapper<Commit>;
  Document: ResolverTypeWrapper<Document>;
  DocumentKind: DocumentKind;
  DocumentPage: ResolverTypeWrapper<DocumentPage>;
  Element: ResolverTypeWrapper<ShapedElement>;
  ElementFacet: ElementFacet;
  ElementKind: ElementKind;
  ElementShard: ResolverTypeWrapper<ElementShardModel>;
  ElementVariant: ResolverTypeWrapper<ElementVariant>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  PullRequest: ResolverTypeWrapper<PullRequest>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  ReferencePage: ResolverTypeWrapper<ReferencePageRow>;
  ReferenceProvider: ResolverTypeWrapper<ReferenceProviderRow>;
  Repository: ResolverTypeWrapper<RepositorySummary>;
  SearchHit: ResolverTypeWrapper<SearchHit>;
  ShardedProvider: ResolverTypeWrapper<ShardedProvider>;
  Sharding: ResolverTypeWrapper<Sharding>;
  Skill: ResolverTypeWrapper<Skill>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Totals: ResolverTypeWrapper<Totals>;
  WorkflowRun: ResolverTypeWrapper<WorkflowRun>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ApiVersion: ApiVersion;
  Boolean: Scalars['Boolean']['output'];
  Collection: Collection;
  CollectionMember: CollectionMember;
  Commit: Commit;
  Document: Document;
  DocumentPage: DocumentPage;
  Element: ShapedElement;
  ElementShard: ElementShardModel;
  ElementVariant: ElementVariant;
  Int: Scalars['Int']['output'];
  PullRequest: PullRequest;
  Query: Record<PropertyKey, never>;
  ReferencePage: ReferencePageRow;
  ReferenceProvider: ReferenceProviderRow;
  Repository: RepositorySummary;
  SearchHit: SearchHit;
  ShardedProvider: ShardedProvider;
  Sharding: Sharding;
  Skill: Skill;
  String: Scalars['String']['output'];
  Totals: Totals;
  WorkflowRun: WorkflowRun;
}>;

export type ApiVersionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiVersion'] = ResolversParentTypes['ApiVersion']> = ResolversObject<{
  documents?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  syncedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type CollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Collection'] = ResolversParentTypes['Collection']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  kind?: Resolver<Maybe<ResolversTypes['DocumentKind']>, ParentType, ContextType>;
  members?: Resolver<Array<ResolversTypes['CollectionMember']>, ParentType, ContextType>;
  search?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  section?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type CollectionMemberResolvers<ContextType = any, ParentType extends ResolversParentTypes['CollectionMember'] = ResolversParentTypes['CollectionMember']> = ResolversObject<{
  kind?: Resolver<ResolversTypes['DocumentKind'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  section?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  summary?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type CommitResolvers<ContextType = any, ParentType extends ResolversParentTypes['Commit'] = ResolversParentTypes['Commit']> = ResolversObject<{
  author?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  committedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sha?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type DocumentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DocumentKind'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  section?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sha?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  summary?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  syncedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  words?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type DocumentPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocumentPage'] = ResolversParentTypes['DocumentPage']> = ResolversObject<{
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rows?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type ElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['Element'] = ResolversParentTypes['Element']> = ResolversObject<{
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['ElementKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  partOf?: Resolver<Array<ResolversTypes['Element']>, ParentType, ContextType>;
  parts?: Resolver<Array<ResolversTypes['Element']>, ParentType, ContextType>;
  shards?: Resolver<Array<ResolversTypes['ElementShard']>, ParentType, ContextType>;
  subcategory?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  variants?: Resolver<Array<ResolversTypes['ElementVariant']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type ElementShardResolvers<ContextType = any, ParentType extends ResolversParentTypes['ElementShard'] = ResolversParentTypes['ElementShard']> = ResolversObject<{
  facet?: Resolver<ResolversTypes['ElementFacet'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  section?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sha?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type ElementVariantResolvers<ContextType = any, ParentType extends ResolversParentTypes['ElementVariant'] = ResolversParentTypes['ElementVariant']> = ResolversObject<{
  about?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  prop?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type PullRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['PullRequest'] = ResolversParentTypes['PullRequest']> = ResolversObject<{
  author?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  draft?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  apiVersion?: Resolver<ResolversTypes['ApiVersion'], ParentType, ContextType>;
  changedSince?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType, RequireFields<QueryChangedSinceArgs, 'shas'>>;
  collection?: Resolver<Maybe<ResolversTypes['Collection']>, ParentType, ContextType, RequireFields<QueryCollectionArgs, 'id'>>;
  collections?: Resolver<Array<ResolversTypes['Collection']>, ParentType, ContextType>;
  document?: Resolver<Maybe<ResolversTypes['Document']>, ParentType, ContextType, Partial<QueryDocumentArgs>>;
  documentPage?: Resolver<ResolversTypes['DocumentPage'], ParentType, ContextType, RequireFields<QueryDocumentPageArgs, 'limit' | 'offset'>>;
  documents?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType, RequireFields<QueryDocumentsArgs, 'limit' | 'offset'>>;
  element?: Resolver<Maybe<ResolversTypes['Element']>, ParentType, ContextType, RequireFields<QueryElementArgs, 'name'>>;
  elementShard?: Resolver<Maybe<ResolversTypes['ElementShard']>, ParentType, ContextType, RequireFields<QueryElementShardArgs, 'path'>>;
  elements?: Resolver<Array<ResolversTypes['Element']>, ParentType, ContextType, Partial<QueryElementsArgs>>;
  findReference?: Resolver<Array<ResolversTypes['ReferencePage']>, ParentType, ContextType, RequireFields<QueryFindReferenceArgs, 'limit' | 'query'>>;
  providers?: Resolver<Array<ResolversTypes['ReferenceProvider']>, ParentType, ContextType>;
  repository?: Resolver<Maybe<ResolversTypes['Repository']>, ParentType, ContextType>;
  search?: Resolver<Array<ResolversTypes['SearchHit']>, ParentType, ContextType, RequireFields<QuerySearchArgs, 'limit' | 'query'>>;
  sharding?: Resolver<ResolversTypes['Sharding'], ParentType, ContextType>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, Partial<QuerySkillArgs>>;
  skills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType>;
  totals?: Resolver<ResolversTypes['Totals'], ParentType, ContextType>;
}>;

export type ReferencePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReferencePage'] = ResolversParentTypes['ReferencePage']> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  section?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type ReferenceProviderResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReferenceProvider'] = ResolversParentTypes['ReferenceProvider']> = ResolversObject<{
  entries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fetchedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pages?: Resolver<Array<ResolversTypes['ReferencePage']>, ParentType, ContextType, RequireFields<ReferenceProviderPagesArgs, 'limit'>>;
  parent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usedFor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type RepositoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Repository'] = ResolversParentTypes['Repository']> = ResolversObject<{
  commits?: Resolver<Array<ResolversTypes['Commit']>, ParentType, ContextType, RequireFields<RepositoryCommitsArgs, 'limit'>>;
  defaultBranch?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nameWithOwner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  openIssues?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pullRequests?: Resolver<Array<ResolversTypes['PullRequest']>, ParentType, ContextType, RequireFields<RepositoryPullRequestsArgs, 'limit'>>;
  pushedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stars?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workflowRuns?: Resolver<Array<ResolversTypes['WorkflowRun']>, ParentType, ContextType, RequireFields<RepositoryWorkflowRunsArgs, 'limit'>>;
}>;

export type SearchHitResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchHit'] = ResolversParentTypes['SearchHit']> = ResolversObject<{
  document?: Resolver<ResolversTypes['Document'], ParentType, ContextType>;
  excerpt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type ShardedProviderResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShardedProvider'] = ResolversParentTypes['ShardedProvider']> = ResolversObject<{
  entries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sections?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usedFor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ShardingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Sharding'] = ResolversParentTypes['Sharding']> = ResolversObject<{
  byProvider?: Resolver<Array<ResolversTypes['ShardedProvider']>, ParentType, ContextType>;
  entries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  providers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type SkillResolvers<ContextType = any, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type TotalsResolvers<ContextType = any, ParentType extends ResolversParentTypes['Totals'] = ResolversParentTypes['Totals']> = ResolversObject<{
  documents?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  providers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  referencePages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  syncedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type WorkflowRunResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkflowRun'] = ResolversParentTypes['WorkflowRun']> = ResolversObject<{
  branch?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  conclusion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ApiVersion?: ApiVersionResolvers<ContextType>;
  Collection?: CollectionResolvers<ContextType>;
  CollectionMember?: CollectionMemberResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  Document?: DocumentResolvers<ContextType>;
  DocumentPage?: DocumentPageResolvers<ContextType>;
  Element?: ElementResolvers<ContextType>;
  ElementShard?: ElementShardResolvers<ContextType>;
  ElementVariant?: ElementVariantResolvers<ContextType>;
  PullRequest?: PullRequestResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ReferencePage?: ReferencePageResolvers<ContextType>;
  ReferenceProvider?: ReferenceProviderResolvers<ContextType>;
  Repository?: RepositoryResolvers<ContextType>;
  SearchHit?: SearchHitResolvers<ContextType>;
  ShardedProvider?: ShardedProviderResolvers<ContextType>;
  Sharding?: ShardingResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  Totals?: TotalsResolvers<ContextType>;
  WorkflowRun?: WorkflowRunResolvers<ContextType>;
}>;

