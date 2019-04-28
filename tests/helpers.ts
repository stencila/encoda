import path from 'path'

/**
 * Get the full path to a fixture directory or file
 *
 * @param fixture The subpath to the fixture
 */
export function fixture(fixture: string): string {
  return path.join(__dirname, 'fixtures', fixture)
}
