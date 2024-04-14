// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as ProfileRouteImport } from './routes/profile/route'
import { Route as ProductsRouteImport } from './routes/products/route'
import { Route as CartRouteImport } from './routes/cart/route'
import { Route as AuthRouteImport } from './routes/auth/route'
import { Route as AdminRouteImport } from './routes/admin/route'
import { Route as IndexImport } from './routes/index'
import { Route as ProductsIndexImport } from './routes/products/index'
import { Route as AuthIndexImport } from './routes/auth/index'
import { Route as AdminIndexImport } from './routes/admin/index'
import { Route as ProductsIdIndexImport } from './routes/products/$id/index'
import { Route as AuthMagicLinkIndexImport } from './routes/auth/magic-link/index'
import { Route as AdminNewProductIndexImport } from './routes/admin/new-product/index'

// Create/Update Routes

const ProfileRouteRoute = ProfileRouteImport.update({
  path: '/profile',
  getParentRoute: () => rootRoute,
} as any)

const ProductsRouteRoute = ProductsRouteImport.update({
  path: '/products',
  getParentRoute: () => rootRoute,
} as any)

const CartRouteRoute = CartRouteImport.update({
  path: '/cart',
  getParentRoute: () => rootRoute,
} as any)

const AuthRouteRoute = AuthRouteImport.update({
  path: '/auth',
  getParentRoute: () => rootRoute,
} as any)

const AdminRouteRoute = AdminRouteImport.update({
  path: '/admin',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ProductsIndexRoute = ProductsIndexImport.update({
  path: '/',
  getParentRoute: () => ProductsRouteRoute,
} as any)

const AuthIndexRoute = AuthIndexImport.update({
  path: '/',
  getParentRoute: () => AuthRouteRoute,
} as any)

const AdminIndexRoute = AdminIndexImport.update({
  path: '/',
  getParentRoute: () => AdminRouteRoute,
} as any)

const ProductsIdIndexRoute = ProductsIdIndexImport.update({
  path: '/$id/',
  getParentRoute: () => ProductsRouteRoute,
} as any)

const AuthMagicLinkIndexRoute = AuthMagicLinkIndexImport.update({
  path: '/magic-link/',
  getParentRoute: () => AuthRouteRoute,
} as any)

const AdminNewProductIndexRoute = AdminNewProductIndexImport.update({
  path: '/new-product/',
  getParentRoute: () => AdminRouteRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/admin': {
      preLoaderRoute: typeof AdminRouteImport
      parentRoute: typeof rootRoute
    }
    '/auth': {
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRoute
    }
    '/cart': {
      preLoaderRoute: typeof CartRouteImport
      parentRoute: typeof rootRoute
    }
    '/products': {
      preLoaderRoute: typeof ProductsRouteImport
      parentRoute: typeof rootRoute
    }
    '/profile': {
      preLoaderRoute: typeof ProfileRouteImport
      parentRoute: typeof rootRoute
    }
    '/admin/': {
      preLoaderRoute: typeof AdminIndexImport
      parentRoute: typeof AdminRouteImport
    }
    '/auth/': {
      preLoaderRoute: typeof AuthIndexImport
      parentRoute: typeof AuthRouteImport
    }
    '/products/': {
      preLoaderRoute: typeof ProductsIndexImport
      parentRoute: typeof ProductsRouteImport
    }
    '/admin/new-product/': {
      preLoaderRoute: typeof AdminNewProductIndexImport
      parentRoute: typeof AdminRouteImport
    }
    '/auth/magic-link/': {
      preLoaderRoute: typeof AuthMagicLinkIndexImport
      parentRoute: typeof AuthRouteImport
    }
    '/products/$id/': {
      preLoaderRoute: typeof ProductsIdIndexImport
      parentRoute: typeof ProductsRouteImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  AdminRouteRoute.addChildren([AdminIndexRoute, AdminNewProductIndexRoute]),
  AuthRouteRoute.addChildren([AuthIndexRoute, AuthMagicLinkIndexRoute]),
  CartRouteRoute,
  ProductsRouteRoute.addChildren([ProductsIndexRoute, ProductsIdIndexRoute]),
  ProfileRouteRoute,
])
