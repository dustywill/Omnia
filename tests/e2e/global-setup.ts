import { execSync } from 'child_process';

export default async () => {
  execSync('npm run build', { stdio: 'inherit' });
};
