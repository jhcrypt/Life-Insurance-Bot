# CI/CD Guide for Insurance Chat

This guide covers Continuous Integration and Continuous Deployment (CI/CD) setup for the Insurance Chat module, focusing on automating testing, building, and deployment processes.

## Table of Contents

- [GitHub Actions Workflow](#github-actions-workflow)
- [Environment Setup](#environment-setup)
- [Test Automation](#test-automation)
- [Deployment Strategies](#deployment-strategies)
- [API Key Management](#api-key-management)
- [Best Practices](#best-practices)

## GitHub Actions Workflow

### Basic Workflow Configuration

Create a `.github/workflows/insurance-chat.yml` file to define your CI/CD pipeline:

```yaml
name: Insurance Chat CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'
      - '.github/workflows/insurance-chat.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint -- --max-warnings=0
        
      - name: Run unit tests
        run: npm test -- --testPathPattern="insurance-chat" --testPathIgnorePatterns="integration|performance"
```

### Advanced Multi-Job Workflow

For a more comprehensive pipeline:

```yaml
name: Insurance Chat CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linter
        run: npm run lint -- --max-warnings=0
  
  unit-tests:
    needs: lint
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test -- --testPathPattern="insurance-chat" --testPathIgnorePatterns="integration|performance"
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: junit.xml
  
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || contains(github.event.pull_request.labels.*.name, 'run-integration')
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        env:
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.TEST_ANTHROPIC_API_KEY }}
        run: npm test -- --testPathPattern="insurance-chat/integration"
  
  build:
    needs: [unit-tests]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: build/
  
  deploy-staging:
    needs: [build, integration-tests]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: build/
      - name: Deploy to staging
        env:
          DEPLOY_TOKEN: ${{ secrets.STAGING_DEPLOY_TOKEN }}
        run: |
          echo "Deploying to staging environment..."
          # Add your deployment commands here
  
  deploy-production:
    needs: [build, integration-tests]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: build/
      - name: Deploy to production
        env:
          DEPLOY_TOKEN: ${{ secrets.PRODUCTION_DEPLOY_TOKEN }}
        run: |
          echo "Deploying to production environment..."
          # Add your production deployment commands here
```

## Environment Setup

### Environment Variables

Create appropriate environment files for different stages:

**`.env.ci`** (for CI environment):

```
# Base settings for CI
NODE_ENV=test
DEBUG=false
REACT_APP_API_URL=https://api-test.example.com
REACT_APP_DISABLE_ANALYTICS=true

# Mock settings for non-integration tests
MOCK_AI_RESPONSES=true
```

**`.env.staging`**:

```
NODE_ENV=production
REACT_APP_API_URL=https://api-staging.example.com
REACT_APP_ENVIRONMENT=staging
```

**`.env.production`**:

```
NODE_ENV=production
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENVIRONMENT=production
```

### Setting Up Environment in GitHub Actions

```yaml
- name: Set up environment variables
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      cp .env.production .env
    elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
      cp .env.staging .env
    else
      cp .env.ci .env
    fi
```

### Environment Configuration in package.json

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "build:staging": "env-cmd -f .env.staging react-scripts build",
    "build:prod": "env-cmd -f .env.production react-scripts build",
    "test": "react-scripts test",
    "test:ci": "react-scripts test --ci --watchAll=false --coverage"
  }
}
```

## Test Automation

### Organizing Test Runs

Split your tests into different categories for efficient CI:

```yaml
# Fast tests for every PR
- name: Run unit tests
  run: npm test -- --testPathPattern="insurance-chat" --testPathIgnorePatterns="integration|performance"

# Integration tests for main branches
- name: Run integration tests
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
  env:
    OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
  run: npm test -- --testPathPattern="insurance-chat/integration"

# Nightly performance tests
- name: Run performance tests
  if: github.event_name == 'schedule'
  env:
    OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
    NODE_OPTIONS: '--max-old-space-size=4096'
  run: npm test -- --testPathPattern="insurance-chat/performance"
```

### Test Reporting

Add test reporting to your CI pipeline:

```yaml
- name: Run tests with reporting
  run: npm test -- --ci --reporters=default --reporters=jest-junit
  env:
    JEST_JUNIT_OUTPUT_DIR: ./reports/
    JEST_JUNIT_OUTPUT_NAME: jest-junit.xml

- name: Upload test report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-reports
    path: ./reports/
```

### Matrix Testing

Test across multiple configurations:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
        provider: ['openai', 'anthropic']
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Test with ${{ matrix.provider }}
        env:
          TEST_PROVIDER: ${{ matrix.provider }}
        run: npm test
```

## Deployment Strategies

### Staging and Production Deployments

Use environment-specific deployment jobs:

```yaml
deploy-staging:
  needs: [build, integration-tests]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/develop'
  environment: staging
  
  steps:
    - name: Download artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-artifacts
    
    - name: Deploy to staging
      uses: netlify/actions/cli@master
      with:
        args: deploy --dir=build --site=${{ secrets.NETLIFY_STAGING_SITE_ID }}
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

deploy-production:
  needs: [build, integration-tests]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  environment: production
  
  steps:
    - name: Download artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-artifacts
    
    - name: Deploy to production
      uses: netlify/actions/cli@master
      with:
        args: deploy --dir=build --prod --site=${{ secrets.NETLIFY_PRODUCTION_SITE_ID }}
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### Canary Deployments

For gradual rollout of new features:

```yaml
deploy-canary:
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    
    - name: Deploy canary
      run: |
        echo "Deploying to 10% of users..."
        # Deploy with feature flag for partial rollout
        DEPLOY_PARAMS="--feature-flag=insurance-chat-new --rollout-percentage=10"
        ./deploy.sh $DEPLOY_PARAMS
```

### Feature Branch Previews

Test feature branches with preview deployments:

```yaml
deploy-preview:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  
  steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    
    - name: Deploy preview
      uses: netlify/actions/cli@master
      with:
        args: deploy --dir=build --alias=${{ github.head_ref }}
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
    
    - name: Comment PR with preview URL
      uses: actions/github-script@v6
      with:
        script: |
          const comment = `🚀 Preview deployment is ready!
          Preview URL: https://${process.env.PREVIEW_URL}`;
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          })
      env:
        PREVIEW_URL: ${{ github.head_ref }}--yourproject.netlify.app
```

## API Key Management

Secure handling of API keys is critical for AI-powered applications.

### Storing API Keys

Store API keys in GitHub Secrets:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `TEST_OPENAI_API_KEY`: API key for OpenAI in test environment
   - `TEST_ANTHROPIC_API_KEY`: API key for Anthropic in test environment
   - `PROD_OPENAI_API_KEY`: API key for production use

### Using API Keys in Workflows

```yaml
- name: Run integration tests
  env:
    OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
    ANTHROPIC_API_KEY: ${{ secrets.TEST_ANTHROPIC_API_KEY }}
  run: npm test -- --testPathPattern="insurance-chat/integration"
```

### Rotating API Keys

Implement API key rotation to enhance security:

```yaml
- name: Rotate API keys
  if: github.event_name == 'schedule' && github.event.schedule == '0 0 * * 0'
  run: |
    curl -X POST \
      -H "Authorization: Bearer ${{ secrets.API_KEY_ROTATION_TOKEN }}" \
      -H "Content-Type: application/json" \
      https://api.example.com/rotate-keys
```

## Best Practices

### 1. Use Caching to Speed Up Builds

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Cache Jest
  uses: actions/cache@v3
  with:
    path: .jest-cache
    key: ${{ runner.os }}-jest-${{ hashFiles('**/jest.config.js') }}
    restore-keys: |
      ${{ runner.os }}-jest-

- name: Cache build
  uses: actions/cache@v3
  with:
    path: |
      build
      .next/cache
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-
```

### 2. Optimize Test Runs

```yaml
# Split tests into parallel jobs
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests (shard ${{ matrix.shard }})
        run: npm test -- --shard=${{ matrix.shard }}/4
```

### 3. Implement Security Checks

```yaml
- name: Run security scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

- name: Check for secrets in code
  uses: gitleaks/gitleaks-action@v2
  env:
    GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

- name: Run dependency audit
  run: npm audit --production
```

### 4. Monitor Build Performance

```yaml
- name: Record build metrics
  run: |
    echo "BUILD_START=$(date +%s%N | cut -b1-13)" >> $GITHUB_ENV
    npm run build
    BUILD_END=$(date +%s%N | cut -b1-13)
    BUILD_DURATION=$((BUILD_END - $BUILD_START))
    echo "Build duration: ${BUILD_DURATION}ms"
    # Optionally send metrics to monitoring system
    curl -X POST -H "Content-Type: application/json" \
         -d "{\"build_duration\": $BUILD_DURATION, \"commit\": \"$GITHUB_SHA\"}" \
         https://metrics.example.com/api/build-times
```

### 5. Automate Version Management

```yaml
- name: Bump version
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    npm version patch
    git push
    git push --tags
```

### 6. Implement Rollback Procedures

```yaml
- name: Deploy with rollback capability
  run: |
    # Store the current version
    CURRENT_VERSION=$(cat package.json | jq -r .version)
    echo "CURRENT_VERSION=$CURRENT_VERSION" >> $GITHUB_ENV
    
    # Deploy
    if ! ./deploy.sh; then
      echo "Deployment failed, rolling back..."
      ./rollback.sh $CURRENT_VERSION
      exit 1
    fi
```

### 7. Add Status Checks

```yaml
- name: Verify deployment
  run: |
    # Wait for deployment to stabilize
    sleep 30
    
    # Check application health
    HEALTH_CHECK=$(curl -s https://api-staging.example.com/health)
    if [[ $HEALTH_CHECK != *"healthy"* ]]; then
      echo "Health check failed"
      exit 1
    fi
    
    # Verify that insurance chat is working
    CHAT_CHECK=$(curl -s https://api-staging.example.com/api/insurance-chat/status)
    if [[ $CHAT_CHECK != *"available"* ]]; then
      echo "Insurance chat functionality check failed"
      exit 1
    fi
```

### 8. Implement Feature Flags

```yaml
- name: Configure feature flags
  run: |
    # Update feature flag configuration based on environment
    if [[ "$GITHUB_REF" == "refs/heads/main" ]]; then
      # Production - enable stable features only
      FLAGS="insurance-chat=true,advanced-prompts=true,voice-input=false"
    elif [[ "$GITHUB_REF" == "refs/heads/develop" ]]; then
      # Staging - enable experimental features
      FLAGS="insurance-chat=true,advanced-prompts=true,voice-input=true"
    fi
    
    # Update feature flags configuration
    echo "Setting feature flags: $FLAGS"
    curl -X POST \
         -H "Authorization: Bearer ${{ secrets.CONFIG_API_TOKEN }}" \
         -H "Content-Type: application/json" \
         -d "{\"flags\": \"$FLAGS\"}" \
         https://config.example.com/api/update-flags
```

### 9. Implement Continuous Monitoring

```yaml
- name: Set up monitoring
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
  run: |
    # Deploy monitoring dashboards
    ENVIRONMENT=$([ "$GITHUB_REF" == "refs/heads/main" ] && echo "production" || echo "staging")
    
    # Set up alerting for the new deployment
    curl -X POST \
         -H "Authorization: Bearer ${{ secrets.MONITORING_API_TOKEN }}" \
         -H "Content-Type: application/json" \
         -d "{\"service\": \"insurance-chat\", \"version\": \"$(cat package.json | jq -r .version)\", \"environment\": \"$ENVIRONMENT\"}" \
         https://monitoring.example.com/api/setup-alerts
```

## Summary

A robust CI/CD pipeline for the Insurance Chat module should:

1. **Automate Testing**
   - Run unit tests on every PR
   - Run integration tests on main branches
   - Run performance tests nightly

2. **Secure Deployments**
   - Use environment-specific configurations
   - Implement proper API key management
   - Include security scans

3. **Monitor Performance**
   - Track build times
   - Monitor deployment success
   - Implement health checks

4. **Support Recovery**
   - Enable quick rollbacks
   - Maintain deployment history
   - Log all actions

5. **Optimize Workflows**
   - Use caching effectively
   - Implement matrix testing
   - Parallelize test runs

By implementing these best practices, you'll create a CI/CD pipeline that ensures reliable and efficient testing, building, and deployment of your Insurance Chat implementation.

