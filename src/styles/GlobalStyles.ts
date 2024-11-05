import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overscroll-behavior: none;
    overflow: hidden;
    position: fixed;
    width: 100%;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  html {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  input, textarea {
    -webkit-touch-callout: default;
    -webkit-user-select: text;
    user-select: text;
  }

  body {
    position: fixed;
    width: 100%;
  }
`

export default GlobalStyles 