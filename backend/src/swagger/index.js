import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

export function buildSwaggerSpec() {
  return swaggerJSDoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LumiX API',
        version: '0.1.0'
      },
      servers: [{ url: 'http://localhost:4000' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          ErrorResponse: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { nullable: true }
            }
          },
          SuccessResponse: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          Shop: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              onlineBookingEnabled: { type: 'boolean' },
              address: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              logo: { type: 'string', nullable: true }
            }
          },
          ServiceCategory: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              shopId: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' }
            }
          },
          Service: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              shopId: { type: 'string' },
              categoryId: { type: 'string' },
              name: { type: 'string' },
              shortDescription: { type: 'string', nullable: true },
              detailedDescription: { type: 'string', nullable: true },
              price: { type: 'number' },
              durationMinutes: { type: 'number' },
              status: { type: 'string' }
            }
          },
          ShopStaff: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              shopId: { type: 'string' },
              fullName: { type: 'string' },
              shortBio: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              specialties: { type: 'array', items: { type: 'string' } },
              phone: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' }
            }
          },
          Booking: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              bookingCode: { type: 'string' },
              shopId: { type: 'string' },
              customerName: { type: 'string' },
              customerPhone: { type: 'string' },
              serviceId: { type: 'string' },
              staffId: { type: 'string', nullable: true },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              depositAmount: { type: 'number' },
              totalAmount: { type: 'number' },
              note: { type: 'string', nullable: true }
            }
          },
          Wallet: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              shopId: { type: 'string' },
              balance: { type: 'number' },
              escrowBalance: { type: 'number' },
              status: { type: 'string' }
            }
          },
          WalletTransaction: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              walletId: { type: 'string' },
              shopId: { type: 'string' },
              type: { type: 'string' },
              amount: { type: 'number' },
              balanceBefore: { type: 'number', nullable: true },
              balanceAfter: { type: 'number', nullable: true },
              status: { type: 'string' },
              description: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          Deposit: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              bookingId: { type: 'string' },
              shopId: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' }
            }
          },
          RefundRequest: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              bookingId: { type: 'string' },
              shopId: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
              bankInfo: { type: 'object', nullable: true }
            }
          },
          Review: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              bookingId: { type: 'string' },
              shopId: { type: 'string' },
              rating: { type: 'number' },
              content: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          Notification: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              userId: { type: 'string', nullable: true },
              shopId: { type: 'string', nullable: true },
              title: { type: 'string' },
              message: { type: 'string' },
              type: { type: 'string', nullable: true },
              channel: { type: 'string', nullable: true },
              isRead: { type: 'boolean', nullable: true },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          PlatformFee: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              bookingId: { type: 'string', nullable: true },
              shopId: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          GenericTransaction: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              type: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string', nullable: true },
              shopId: { type: 'string', nullable: true },
              bookingId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          BookingResponse: {
            type: 'object',
            properties: {
              booking: { $ref: '#/components/schemas/Booking' }
            }
          },
          BookingListResponse: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/Booking' }
              },
              total: { type: 'number', nullable: true }
            }
          },
          ShopResponse: {
            type: 'object',
            properties: {
              shop: { $ref: '#/components/schemas/Shop' }
            }
          },
          WalletResponse: {
            type: 'object',
            properties: {
              wallet: { $ref: '#/components/schemas/Wallet' }
            }
          },
          RefundResponse: {
            type: 'object',
            properties: {
              refund: { $ref: '#/components/schemas/RefundRequest' }
            }
          },
          User: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              role: { type: 'string' },
              fullName: { type: 'string', nullable: true },
              phone: { type: 'string', nullable: true },
              email: { type: 'string', nullable: true },
              shopId: { type: 'string', nullable: true },
              status: { type: 'string', nullable: true }
            }
          },
          AuthLoginResponse: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
              shop: { $ref: '#/components/schemas/Shop' }
            }
          },
          MeResponse: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              shop: { $ref: '#/components/schemas/Shop' }
            }
          },
          UploadImageResponse: {
            type: 'object',
            properties: {
              fileId: { type: 'string' },
              fileName: { type: 'string', nullable: true },
              url: { type: 'string' },
              size: { type: 'number', nullable: true },
              publicId: { type: 'string', nullable: true }
            }
          },
          WebhookAckResponse: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' }
            }
          }
        },
        responses: {
          Ok: {
            description: '200 OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          BadRequest: {
            description: '400 Bad Request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          Unauthorized: {
            description: '401 Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          NotFound: {
            description: '404 Không tìm thấy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          Conflict: {
            description: '409 Conflict',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    apis: ['src/routes/**/*.js', 'src/controllers/**/*.js']
  })
}

export function swaggerUiSetup(spec) {
  return swaggerUi.setup(spec, {
    explorer: true
  })
}

export function swaggerJsonHandler(spec) {
  return (req, res) => res.json(spec)
}

export { swaggerUi }

