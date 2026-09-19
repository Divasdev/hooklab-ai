import { execSync } from 'node:child_process';

console.log('🚀 Running HookLab pre-flight health checks...');

try {
  console.log('1/4 Checking relevance tests...');
  execSync('npm run test:relevance', { stdio: 'inherit' });

  console.log('2/4 Checking saved hooks and expansion...');
  execSync('npm run test:features', { stdio: 'inherit' });
  console.log('3/4 Checking lint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('4/4 Checking TypeScript and bundle build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All health checks passed successfully!');
} catch (error) {
  console.error('❌ Health check failed:', error);
  process.exit(1);
}
