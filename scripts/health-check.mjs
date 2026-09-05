import { execSync } from 'node:child_process';

console.log('🚀 Running HookLab pre-flight health checks...');

try {
  console.log('1/2 Checking relevance tests...');
  execSync('npm run test:relevance', { stdio: 'inherit' });

  console.log('2/2 Checking TypeScript and bundle build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All health checks passed successfully!');
} catch (error) {
  console.error('❌ Health check failed:', error);
  process.exit(1);
}
