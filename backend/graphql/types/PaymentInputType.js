import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql'

const PaymentInputType = new GraphQLInputObjectType({
  name: 'PaymentInput',
  fields: {
    status: {
      type: new GraphQLNonNull(GraphQLString),
    },
    mode: {
      type: new GraphQLNonNull(GraphQLString),
    },
    transactionID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export default PaymentInputType
