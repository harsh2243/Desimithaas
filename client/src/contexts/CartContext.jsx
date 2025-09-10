import { createContext, useContext, useReducer, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext()

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload || initialState
    
    case 'ADD_ITEM': {
      const items = state?.items || []
      const existingItemIndex = items.findIndex(
        item => item.product._id === action.payload.product._id
      )
      
      let newItems
      if (existingItemIndex >= 0) {
        newItems = items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...items, action.payload]
      }
      
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => {
          const price = item.product.discountPrice || item.product.price;
          return sum + (price * item.quantity);
        }, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
      
      localStorage.setItem('cart', JSON.stringify(newState))
      return newState
    }
    
    case 'REMOVE_ITEM': {
      const items = state?.items || []
      const newItems = items.filter(item => item.product._id !== action.payload)
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => {
          const price = item.product.discountPrice || item.product.price;
          return sum + (price * item.quantity);
        }, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
      
      localStorage.setItem('cart', JSON.stringify(newState))
      return newState
    }
    
    case 'UPDATE_QUANTITY': {
      const items = state?.items || []
      const newItems = items.map(item =>
        item.product._id === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
      
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => {
          const price = item.product.discountPrice || item.product.price;
          return sum + (price * item.quantity);
        }, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
      
      localStorage.setItem('cart', JSON.stringify(newState))
      return newState
    }
    
    case 'CLEAR_CART': {
      const newState = { items: [], total: 0, itemCount: 0 }
      localStorage.setItem('cart', JSON.stringify(newState))
      return newState
    }
    
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Ensure the parsed cart has the required structure
        const validatedCart = {
          items: parsedCart?.items || [],
          total: parsedCart?.total || 0,
          itemCount: parsedCart?.itemCount || 0
        }
        dispatch({ type: 'LOAD_CART', payload: validatedCart })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Initialize with empty cart on error
        dispatch({ type: 'LOAD_CART', payload: initialState })
      }
    }
  }, [])

  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { product, quantity }
    })
    toast.success(`${product.name} added to cart`)
  }

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
    toast.success('Item removed from cart')
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity }
    })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Cart cleared')
  }

  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.product._id === productId)
    return item ? item.quantity : 0
  }

  const getCartTotal = () => {
    return state.items.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
  }

  const value = {
    ...state,
    cartItems: state.items, // Alias for compatibility
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getCartTotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
