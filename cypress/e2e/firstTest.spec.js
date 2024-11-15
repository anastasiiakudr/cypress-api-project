// Test suite for backend interactions
describe("Test with backend", () => {
  
  // Setup: Intercept tags API and login before each test
  beforeEach("login to the app", () => {
    cy.intercept({ method: "GET", path: "tags" }, { fixture: "tags.json" })
    cy.loginToApplication()
  })

  // Test 1: Verify request and response modification for article creation
  it("verify correct request and response", () => {
    cy.intercept("POST", "**/articles", (req) => {
      req.reply((res) => {
        // Validate initial response and modify description
        expect(res.body.article.description).to.equal("This is a description")
        res.body.article.description = "This is a description 2"
      })
    }).as("postArticles")

    // Simulate user creating a new article
    cy.contains("New Article").click()
    cy.get('[formcontrolname="title"]').type("It is the title.")
    cy.get('[formcontrolname="description"]').type("This is a description")
    cy.get('[formcontrolname="body"]').type("This is a body of the article")
    cy.contains("Publish Article").click()

    // Wait for and validate intercepted request
    cy.wait("@postArticles").then((xhr) => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal("This is a body of the article")
      expect(xhr.response.body.article.description).to.equal("This is a description 2")
    })
  })

  // Test 2: Verify popular tags display correctly on the page
  it("verify popular tags are displayed", () => {
    cy.get(".tag-list")
      .should("contain", "Cypress")
      .and("contain", "Test")
      .and("contain", "Automation")
  })

  // Test 3: Verify like counts in the global feed
  it("verify global feed likes count", () => {
    // Setup intercepts for feed and articles API calls
    cy.intercept(
      "GET",
      "https://conduit-api.bondaracademy.com/api/articles/feed*",
      { articles: [], articlesCount: 0 }
    )
    cy.intercept("GET", "https://conduit-api.bondaracademy.com/api/articles*", {
      fixture: "articles.json"
    })

    cy.contains("Global Feed").click()

    // Validate initial like counts for articles
    cy.get("app-article-list button").then((heartList) => {
      expect(heartList[0]).to.contain("1")
      expect(heartList[1]).to.contain("5")
    })

    // Modify like count in fixture and intercept POST request
    cy.fixture("articles").then((file) => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 6
      cy.intercept(
        "POST",
        `https://conduit-api.bondaracademy.com/api/articles/${articleLink}/favorite`,
        file
      )
    })

    // Click like button and verify updated count
    cy.get("app-article-list button").eq(1).click().should("contain", "6")
  })

  // Test 4: Delete a newly created article in the global feed
  it("delete a new article in a global feed", () => {

    // Article data for creation (in JSON format)
    const bodyRequest = {
      'article': {
        'tagList': [],
        'title': "Request from API 12",
        'description': "API testing is easy",
        'body': "Angular is cool"
      }
    }

    it.only("delete a new article in a global feed", () => {

      // Article data for creation (in JSON format)
      const bodyRequest = {
        'article': {
          'tagList': [],
          'title': "Request from API 12",
          'description': "API testing is easy",
          'body': "Angular is cool"
        }
      }
  
      // Step 1: Login to retrieve auth token
      cy.get('@token').then(token => {
  
        // Step 2: Create a new article with auth token
        cy.request({
          url: "https://conduit-api.bondaracademy.com/api/articles/",
          headers: { Authorization: `Token ${token}` },
          method: "POST",
          body: bodyRequest
        }).then((response) => {
          expect(response.status).to.equal(201) // Ensure article creation is successful
  
          // Save the article's slug from the response for later use
          const articleSlug = response.body.article.slug
  
          // Step 3: Delete the created article from the Global Feed using UI interactions
          cy.contains("Global Feed").click()
          cy.wait(2000) 
          cy.get(".article-preview").first().click()
          cy.get(".article-actions").contains("Delete Article").click() 
  
          // Step 4: Verify the article no longer exists by checking for a 404 response
          cy.wait(1000) 
          cy.request({
            url: `https://conduit-api.bondaracademy.com/api/articles/${articleSlug}`, 
            headers: { Authorization: `Token ${token}` },
            method: "GET",
            failOnStatusCode: false 
          }).then((response) => {
            expect(response.status).to.equal(404) 
          })
        })
      })
  })})
})


