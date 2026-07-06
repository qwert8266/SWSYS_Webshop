import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import productApi from "../api/productApi";


const ProductContext = createContext(null);

export function ProductProvider({children}){


    const createProduct = useCallback(async (productData,accessToken) => {
        return await productApi.createProduct(productData,accessToken);
        }, []
    );

    const updateProduct = useCallback(async (productData,accessToken) => {
        return await productApi.updateProduct(productData,accessToken);
        }, []
    );

    const deleteProduct = useCallback(async (uuid,accessToken) => {
        return await productApi.deleteProduct(uuid,accessToken);
        }, []
    );

    const getProducts = useCallback(async () => {
        return await productApi.getProducts();
        }, []
    );


    const value = useMemo(
    () => ({
      createProduct,
      updateProduct,
      deleteProduct,
      getProducts
    }),
    [createProduct,updateProduct,deleteProduct,getProducts]
  );


  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProd() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProd muss innerhalb eines ProductProvider verwendet werden.");
  }

  return context;
}