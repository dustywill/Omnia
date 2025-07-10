import { execSync } from 'child_process';
import { _electron as electron, ElectronApplication } from '@playwright/test';

let app: ElectronApplication | undefined;

export default async () => {
  execSync('npm run build', { stdio: 'inherit' });
  app = await electron.launch({ args: ['.'] });
  process.env.ELECTRON_WS_ENDPOINT = app.wsEndpoint();
};

export async function teardown() {
  await app?.close();
}
