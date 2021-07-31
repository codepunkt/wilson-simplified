import { Logo } from './logo'
import { ErrorBoundary, LocationProvider, Router } from 'preact-iso'
import routes from 'virtual:routes'

const NotFound = () => <>Not Found</>

export function App(props) {
  return (
    <LocationProvider>
      <div>
        <ErrorBoundary>
          <a href="/">
            <Logo />
          </a>
          <a href="/page1">Page1</a>
          <a href="/page2">Page2</a>
          <a href="/page3">Page3</a>
          <Router>{[...routes, <NotFound key="notFound" default />]}</Router>
        </ErrorBoundary>
      </div>
    </LocationProvider>
  )
}
