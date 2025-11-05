workspace "archlette-demo" "Archlette demo application" {

    model {
        # External actors
        user = person "User" "End user who interacts with the Flarelette Demo UI"
        database = softwareSystem "Database" "Uses D1 database for news & events storage. | Uses D1 database service for form submissions." "External"
        objectstorage = softwareSystem "ObjectStorage" "Uses R2 object storage service for images." "External"
        # archlette-demo System
        archlette_demo = softwareSystem "archlette-demo" {
            description "Archlette demo application"
            # Containers




            flarelette_demo_ui = container "flarelette-demo-ui" {
                description "Cloudflare Worker: flarelette-demo-ui | Astro frontend for Flarelette demo"
                technology "Cloudflare Worker"
                tags "Cloudflare Worker,cloudflare,worker"

                # Components
                flarelette_demo_ui__layouts = component "layouts" {
                    description "Component inferred from directory: layouts"
                    technology "module"
                }
                flarelette_demo_ui__pages = component "pages" {
                    description "Home Page - Landing page for Flarelette Demo application"
                    technology "module"
                }
                flarelette_demo_ui__env = component "env" {
                    description "Environment variable type definitions for Astro project"
                    technology "module"
                }
                flarelette_demo_ui__types = component "types" {
                    description "Shared types for the"
                    technology "module"
                }

                # Code elements (classes, functions)
                flarelette_demo_ui__layouts__baselayout = component "layouts.BaseLayout" {
                    description "Server-side render function for BaseLayout. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__layouts__props = component "layouts.Props" {
                    technology "interface"
                    tags "Code"
                }
                flarelette_demo_ui__pages__contact = component "pages.contact" {
                    description "Server-side render function for contact. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__pages__formatdate = component "pages.formatDate" {
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__pages__events = component "pages.events" {
                    description "Server-side render function for events. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__pages__index = component "pages.index" {
                    description "Server-side render function for index. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__pages__news = component "pages.news" {
                    description "Server-side render function for news. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }
                flarelette_demo_ui__pages__roster = component "pages.roster" {
                    description "Server-side render function for roster. Generates HTML output from Astro component template and props."
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                flarelette_demo_ui__pages -> flarelette_demo_ui__layouts "Uses BaseLayout component"
            }





            content_service = container "content-service" {
                description "Cloudflare Worker: content-service | Content management service - news, events, pages (D1-backed)"
                technology "Cloudflare Worker"
                tags "Cloudflare Worker,cloudflare,worker"

                # Components
                content_service__env = component "env" {
                    description "Environment bindings for Content Service"
                    technology "module"
                }
                content_service__main = component "main" {
                    description "Content Service CMS microservice for news, events, roster, pages. All endpoints require internal JWT verification."
                    technology "module"
                }

                # Code elements (classes, functions)
                content_service__main__getjwtconfig = component "main.getJwtConfig" {
                    description "Get or create JWT config (lazily initialized from environment)"
                    technology "function"
                    tags "Code"
                }
                content_service__main__authguard = component "main.authGuard" {
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                content_service__main -> content_service__env "imports Env"
            }





            forms_service = container "forms-service" {
                description "Cloudflare Worker: forms-service | Form submission service (contact, tryouts, etc.)"
                technology "Cloudflare Worker"
                tags "Cloudflare Worker,cloudflare,worker"

                # Components
                forms_service__main = component "main" {
                    description "Forms Service Handles form submissions (contact, tryouts, etc.) All endpoints require internal JWT verification."
                    technology "module"
                }

                # Code elements (classes, functions)
                forms_service__main__getjwtconfig = component "main.getJwtConfig" {
                    description "Get or create JWT config (lazily initialized from environment)"
                    technology "function"
                    tags "Code"
                }
                forms_service__main__authguard = component "main.authGuard" {
                    technology "function"
                    tags "Code"
                }
            }





            gateway = container "gateway" {
                description "Cloudflare Worker: gateway | Flarelette Gateway - EdDSA signing and routing"
                technology "Cloudflare Worker"
                tags "Cloudflare Worker,cloudflare,worker"

                # Components
                gateway__auth = component "auth" {
                    description "Authentication and token minting"
                    technology "module"
                }
                gateway__env = component "env" {
                    description "Environment bindings for Gateway Worker"
                    technology "module"
                }
                gateway__main = component "main" {
                    description "Flarelette Gateway Entry point for all API traffic. Routes requests to microservices with internal JWT authentication (EdDSA signed). All input is validated with Zod - zero trust!"
                    technology "module"
                }
                gateway__validation = component "validation" {
                    description "Input validation schemas using Zod All input is validated - zero trust!"
                    technology "module"
                }

                # Code elements (classes, functions)
                gateway__auth__getjwtconfig = component "auth.getJwtConfig" {
                    description "Get or create JWT config (lazily initialized from environment)"
                    technology "function"
                    tags "Code"
                }
                gateway__auth__generateanonid = component "auth.generateAnonId" {
                    description "Generate a random anonymous subject ID"
                    technology "function"
                    tags "Code"
                }
                gateway__auth__mintanonymoustoken = component "auth.mintAnonymousToken" {
                    description "Mint an internal JWT for anonymous requests"
                    technology "function"
                    tags "Code"
                }
                gateway__auth__mintauthenticatedtoken = component "auth.mintAuthenticatedToken" {
                    description "Validate external Auth0 token and mint internal token TODO: Implement full Auth0 token validation when Auth0 is configured"
                    technology "function"
                    tags "Code"
                }
                gateway__auth__getormintinternaltoken = component "auth.getOrMintInternalToken" {
                    description "Extract or mint internal token for request"
                    technology "function"
                    tags "Code"
                }
                gateway__main__getserviceurl = component "main.getServiceUrl" {
                    technology "function"
                    tags "Code"
                }
                gateway__main__callservice = component "main.callService" {
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                gateway__main -> gateway__env "imports Env"
                gateway__main -> gateway__auth "imports getOrMintInternalToken"
            }





            image_service = container "image-service" {
                description "Cloudflare Worker: image-service | Image management service with R2 storage"
                technology "Cloudflare Worker"
                tags "Cloudflare Worker,cloudflare,worker"

                # Components
                image_service__main = component "main" {
                    description "Image Service Manages image uploads and galleries using R2 storage. All endpoints require internal JWT verification."
                    technology "module"
                }

                # Code elements (classes, functions)
                image_service__main__getjwtconfig = component "main.getJwtConfig" {
                    description "Get or create JWT config (lazily initialized from environment)"
                    technology "function"
                    tags "Code"
                }
                image_service__main__authguard = component "main.authGuard" {
                    technology "function"
                    tags "Code"
                }
            }

            # Container relationships
            gateway -> content_service "Service binding: CONTENT_SERVICE"
            gateway -> image_service "Service binding: IMAGE_SERVICE"
            gateway -> forms_service "Service binding: FORMS_SERVICE"
        }
        # Actor interactions
        user -> flarelette_demo_ui__pages "Interacts with pages"
        content_service__main -> database "Uses Database for external system integration"
        forms_service__main -> database "Uses Database for external system integration"
        image_service__main -> objectstorage "Uses ObjectStorage for external system integration"
        # Deployment environments

        deploymentEnvironment "production" {
            deploymentNode "Cloudflare Workers" {
                containerInstance flarelette_demo_ui {
                }
                containerInstance content_service {
                }
                containerInstance forms_service {
                }
                containerInstance gateway {
                }
                containerInstance image_service {
                }
            }
        }

        deploymentEnvironment "preview" {
            deploymentNode "Cloudflare Workers" {
                containerInstance flarelette_demo_ui {
                }
            }
        }

        deploymentEnvironment "development" {
            deploymentNode "Cloudflare Workers" {
                containerInstance flarelette_demo_ui {
                }
            }
        }

    }

    views {
/**
 * Default Structurizr theme for Archlette
 * 
 * This theme provides a modern, professional color scheme for architecture diagrams
 * with clear visual hierarchy and accessibility considerations.
 */

theme default

// Element styles
styles {
    // Person/Actor styles
    element "Person" {
        background #08427b
        color #ffffff
        shape Person
        fontSize 22
    }

    // External System styles
    element "External System" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    element "External" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    // System styles
    element "Software System" {
        background #1168bd
        color #ffffff
        shape RoundedBox
        fontSize 24
    }

    // Container styles
    element "Container" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 20
    }

    element "Database" {
        background #438dd5
        color #ffffff
        shape Cylinder
        fontSize 20
    }

    element "Web Browser" {
        background #438dd5
        color #ffffff
        shape WebBrowser
        fontSize 20
    }

    element "Mobile App" {
        background #438dd5
        color #ffffff
        shape MobileDevicePortrait
        fontSize 20
    }

    // Component styles
    element "Component" {
        background #85bbf0
        color #000000
        shape RoundedBox
        fontSize 18
    }

    // Technology-specific styles
    element "Cloudflare Worker" {
        background #f6821f
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "Service" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "API" {
        background #85bbf0
        color #000000
        shape Hexagon
        fontSize 18
    }

    element "Queue" {
        background #85bbf0
        color #000000
        shape Pipe
        fontSize 18
    }

    // Tag-based styles
    element "Internal System" {
        background #1168bd
        color #ffffff
    }

    element "Deprecated" {
        background #cc0000
        color #ffffff
        opacity 60
    }

    element "Future" {
        background #dddddd
        color #000000
        opacity 50
        stroke #999999
        strokeWidth 2
    }

    element "Auto Generated" {
        stroke #999999
        strokeWidth 1
    }

    // Infrastructure styles
    element "Infrastructure" {
        background #92278f
        color #ffffff
        shape RoundedBox
    }

    element "Message Bus" {
        background #85bbf0
        color #000000
        shape Pipe
    }

    // Relationship styles
    relationship "Relationship" {
        color #707070
        dashed false
        routing Curved
        fontSize 12
        thickness 2
    }

    relationship "Async" {
        dashed true
        color #707070
    }

    relationship "Sync" {
        dashed false
        color #707070
    }

    relationship "Uses" {
        color #707070
        dashed false
    }

    relationship "Depends On" {
        color #707070
        dashed true
    }
}

// Diagram customization
branding {
    font "Arial"
}


        systemContext archlette_demo "SystemContext" {
            include user
            include database
            include objectstorage
            include archlette_demo
            autoLayout
        }

        container archlette_demo "Containers" {
            include user
            include database
            include objectstorage
            include flarelette_demo_ui
            include content_service
            include forms_service
            include gateway
            include image_service
            autoLayout
        }


        component flarelette_demo_ui "Components_flarelette_demo_ui" {
            include user
            include flarelette_demo_ui__layouts
            include flarelette_demo_ui__pages
            include flarelette_demo_ui__env
            include flarelette_demo_ui__types
            exclude "element.tag==Code"
            autoLayout
        }


        component content_service "Components_content_service" {
            include database
            include content_service__env
            include content_service__main
            exclude "element.tag==Code"
            autoLayout
        }


        component forms_service "Components_forms_service" {
            include database
            include forms_service__main
            exclude "element.tag==Code"
            autoLayout
        }


        component gateway "Components_gateway" {
            include gateway__auth
            include gateway__env
            include gateway__main
            include gateway__validation
            exclude "element.tag==Code"
            autoLayout
        }


        component image_service "Components_image_service" {
            include objectstorage
            include image_service__main
            exclude "element.tag==Code"
            autoLayout
        }


        component flarelette_demo_ui "Classes_flarelette_demo_ui__layouts" {
            include flarelette_demo_ui__layouts__baselayout
            include flarelette_demo_ui__layouts__props
            autoLayout
        }


        component flarelette_demo_ui "Classes_flarelette_demo_ui__pages" {
            include flarelette_demo_ui__pages__contact
            include flarelette_demo_ui__pages__formatdate
            include flarelette_demo_ui__pages__events
            include flarelette_demo_ui__pages__index
            include flarelette_demo_ui__pages__news
            include flarelette_demo_ui__pages__roster
            autoLayout
        }


        component content_service "Classes_content_service__main" {
            include content_service__main__getjwtconfig
            include content_service__main__authguard
            autoLayout
        }


        component forms_service "Classes_forms_service__main" {
            include forms_service__main__getjwtconfig
            include forms_service__main__authguard
            autoLayout
        }


        component gateway "Classes_gateway__auth" {
            include gateway__auth__getjwtconfig
            include gateway__auth__generateanonid
            include gateway__auth__mintanonymoustoken
            include gateway__auth__mintauthenticatedtoken
            include gateway__auth__getormintinternaltoken
            autoLayout
        }


        component gateway "Classes_gateway__main" {
            include gateway__main__getserviceurl
            include gateway__main__callservice
            autoLayout
        }


        component image_service "Classes_image_service__main" {
            include image_service__main__getjwtconfig
            include image_service__main__authguard
            autoLayout
        }

    }

}
