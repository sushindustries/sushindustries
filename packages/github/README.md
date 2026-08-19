# @sushindustries/github

[GitHub Packages](https://github.com/sushindustries/sushindustries/pkgs/npm/github)

GitHub as an Apollo Connectors provider. One schema file, no resolvers, no
server, no token.

## Install

```bash
pnpm add @sushindustries/github
```

Then compose it into your supergraph:

```yaml
federation_version: =2.12.0
subgraphs:
  github:
    routing_url: http://localhost
    schema:
      file: node_modules/@sushindustries/github/schema.graphql
```

```bash
rover supergraph compose --config ./supergraph.yaml
```

## What it answers

```graphql
query {
  repository(owner: "sushindustries", name: "sushindustries") {
    nameWithOwner
    stars
    pushedAt
    commits(limit: 5) { sha message author committedAt }
    pullRequests(limit: 5) { number title draft author }
    workflowRuns(limit: 5) { name status conclusion branch }
  }
  repositories(owner: "sushindustries", limit: 10) { name stars pushedAt }
}
```

`Repository` is an entity keyed on `owner` and `name`, so anything else in your
supergraph that knows those two can hand over a stub and get the rest back.

## No token, on purpose

Every endpoint here is public. There is no `authorization` header, and adding
one is not an improvement anybody should make casually: Connectors cannot omit
a header conditionally, so a `Bearer {$env.GITHUB_TOKEN}` with the variable
unset sends `Bearer ` and GitHub answers **401 Bad credentials** on every call.
That version composed cleanly and failed on the first request.

The unauthenticated ceiling is sixty requests an hour. A deployment that needs
more should add the header in its own router configuration, where it can be
sure the value exists.

## Checking it

```bash
rover supergraph compose --config ./supergraph.yaml   # composes
rover connector run --schema schema.graphql \
  -c "Query.repository" \
  -v '{"$args": {"owner": "sushindustries", "name": "sushindustries"}}'
rover connector test                                   # 20 assertions
```

The tests mock GitHub rather than calling it. A test that hits GitHub tests
GitHub: it goes red when somebody else deploys, and it spends the rate limit
this provider is built around. `rover connector run` is there for checking
against the real thing.
