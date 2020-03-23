import todos, {getMatches, prepareTodosForDanger} from "./index"

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
        keyword,
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
        keyword,
      )
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        // TODO: Should match
        function testcode() { return 'Do nothing'; };
      `,
        keyword,
      )
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
      # TODO: Should match
      function testcode() { return 'Do nothing'; };
    `,
        keyword,
      )
      expect(matches.length).toBe(1)
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        -- BUGBUG: Should match elm style
        view : Page.View Taco Model (Page.Msg Msg)
        view =
            { body = body
            , modals =
                Page.noModals
            , title = always "Add Custom People"
            , sideOverlay = Nothing
            }
        `,
        'BUGBUG',
      )
      expect(matches.length).toBe(1)
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        -- bugbug: Should match elm style
        view : Page.View Taco Model (Page.Msg Msg)
        view =
            { body = body
            , modals =
                Page.noModals
            , title = always "Add Custom People"
            , sideOverlay = Nothing
            }
        `,
        'bugbug',
      )
      expect(matches.length).toBe(1)
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        -- fixme: Should match elm style
        view : Page.View Taco Model (Page.Msg Msg)
        view =
            { body = body
            , modals =
                Page.noModals
            , title = always "Add Custom People"
            , sideOverlay = Nothing
            }
        `,
        'fixme',
      )
      expect(matches.length).toBe(1)
      expect(matches).toMatchSnapshot()

      matches = getMatches(
        `
        -- TODO: Should match elm style
        view : Page.View Taco Model (Page.Msg Msg)
        view =
            { body = body
            , modals =
                Page.noModals
            , title = always "Add Custom People"
            , sideOverlay = Nothing
            }
        `,
        keyword,
      )
      expect(matches.length).toBe(1)
      expect(matches).toMatchSnapshot()
    })
  })

  describe("prepareTodosForDanger()", () => {
    it("should return added todo's", () => {
      const keywordMatches = {"TODO": []}
      prepareTodosForDanger(["TODO"], "TODO: Added", "", "file.md", ()=>"https://example.com", keywordMatches)

      expect(keywordMatches).toStrictEqual({"TODO": ["``TODO: Added``: [file.md](https://example.com)"]})
    })

    it("should return removed todo's", () => {
      const keywordMatches = {"TODO": []}
      prepareTodosForDanger(["TODO"], "", "TODO: Removed", "file.md", ()=>"https://example.com", keywordMatches)

      expect(keywordMatches).toStrictEqual({"TODO": ["~~TODO: Removed~~: [file.md](https://example.com)"]})
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
