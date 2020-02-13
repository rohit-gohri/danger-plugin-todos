import todos, { getFormattedSrcLink, getMatches, shouldIgnoreFile } from "./index"

declare const global: any

describe("todos()", () => {
  beforeEach(() => {
    global.warn = jest.fn()
    global.message = jest.fn()
    global.fail = jest.fn()
    global.markdown = jest.fn()
  })

  afterEach(() => {
    global.warn = undefined
    global.message = undefined
    global.fail = undefined
    global.markdown = undefined
  })

  describe("getMatches", () => {
    const keyword = "TODO"

    it("should return empty array for no matches", () => {
      const matches = getMatches(
        `
        /**
         * TEST: Should not match
         */
        function testcode() { return 'Do nothing'; };
      `,
        keyword
      )
      expect(matches).toMatchObject([])

      // matches = getMatches(`
      //   TODO: Should not match
      //   function testcode() { return 'Do nothing'; };
      // `, keyword)

      // expect(matches).toMatchObject([]);
    })

    it("should match different comment styles", () => {
      let matches = getMatches(
        `
        /**
         * TODO: Should match
         */
        function testcode() { return 'Do nothing'; };
      `,
        keyword
      )
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        // TODO: Should match
        function testcode() { return 'Do nothing'; };
      `,
        keyword
      )
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
      # TODO: Should match
      function testcode() { return 'Do nothing'; };
    `,
        keyword
      )

      expect(matches).toMatchSnapshot()
    })
  })

  it.skip("Checks for a that message has been called", () => {
    global.danger = {
      github: { pr: { title: "My Test Title" } },
    }

    todos()

    expect(global.message).toHaveBeenCalledWith("PR Title: My Test Title")
  })

  // TODO: Add individual functions tests
})
