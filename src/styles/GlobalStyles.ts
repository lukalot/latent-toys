import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    height: 100%;
    position: fixed;
    width: 100%;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
  }

  body {
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: fixed;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: none;
    touch-action: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  #root {
    height: 100%;
    overflow: hidden;
  }

  input, textarea {
    -webkit-touch-callout: default;
    -webkit-user-select: text;
    user-select: text;
  }
`

export default GlobalStyles 