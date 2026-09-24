import { execSync } from 'node:child_process';

console.log('🚀 Running HookLab pre-flight health checks...');

try {
  console.log('1/6 Checking relevance tests...');
  execSync('npm run test:relevance', { stdio: 'inherit' });

  console.log('2/6 Checking saved hooks and expansion...');
  execSync('npm run test:features', { stdio: 'inherit' });
  console.log('3/6 Checking share previews...');
  execSync('npm run test:share', { stdio: 'inherit' });
  console.log('4/6 Checking serverless functions load in production...');
  execSync('npm run test:functions', { stdio: 'inherit' });
  console.log('5/6 Checking lint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('6/6 Checking TypeScript and bundle build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All health checks passed successfully!');
} catch (error) {
  console.error('❌ Health check failed:', error);
  process.exit(1);
}
