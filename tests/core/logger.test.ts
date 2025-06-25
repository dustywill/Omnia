describe('logger', () => {
  it('writes formatted entries to console and file', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger('testPlugin', logFile);
    await logger.info('hello');

    const fileContent = await fs.readFile(logFile, 'utf8');
    expect(fileContent).toContain('testPlugin');
    expect(fileContent).toContain('INFO');
    expect(fileContent).toContain('hello');
    expect(logSpy).toHaveBeenCalled();
  });
});
