import { doubleCheck } from '../src/doubleCheck';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';

describe('doubleCheck', () => {
  const testDir = path.join(__dirname);

  it('should correctly verify all test cases', async () => {
    const files = await fs.readdir(testDir);
    const testCases = files
      .filter(file => file.endsWith('_before'))
      .map(file => file.split('_')[0]);

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(testCases.length, 0);

    for (const testCase of testCases) {
      const beforePath = path.join(testDir, `${testCase}_before`);
      const changePath = path.join(testDir, `${testCase}_change`);
      const afterPath = path.join(testDir, `${testCase}_after`);

      const before = await fs.readFile(beforePath, 'utf8');
      const change = await fs.readFile(changePath, 'utf8');
      const after = await fs.readFile(afterPath, 'utf8');

      const [passed, message] = await doubleCheck(before, change, after);

      expect(passed).toBe(true);
      if (!passed) {
        console.error(`Test case ${testCase} failed: ${message}`);
      }

      progressBar.increment();
    }

    progressBar.stop();
  });
});