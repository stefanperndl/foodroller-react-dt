1. src/App.jsx line 6 — remove the unused fetchRecipe import                                                                                                                       
                                                                                  
2. Test files — replace waitFor + getBy* with findBy* (same thing, shorter syntax:                                                                                                
    // before                                                       
    await waitFor(() => screen.getByText('Beef Stew'))                                                                                                                                 
    // after                                                                                                                              
    await screen.findByText('Beef Stew')                                                                                                                                               
                                                                                                                                                                               
3. Test files — replace direct DOM access with Testing Library queries:
    // before (FoodList.test.jsx, RecipeCard.test.jsx, RecipeDetailModal.test.jsx)                                                                                             
    document.querySelector('.modal-overlay')                     
    document.querySelector('.modal-content')
    // after                                                                                                                                                                           
    screen.getByRole('dialog')  // or use data-testid on the element
                                                                                                                                                                                       
4. next lint deprecation — not a breaking error but CI will eventually need migration to the ESLint CLI. Low priority, add to backlog.
