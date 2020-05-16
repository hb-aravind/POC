const Enum = {};

Enum.Gender = {
  MALE: 'male',
  FEMALE: 'female',
};
Enum.COUPON_TYPE = {
  FLAT: 'Flat',
  PERCENTAGE: 'Percentage',
};
Enum.LENGTH = {
  Capability: {
    Name: 50,
    Slug: 100,
    Group: 50,
  },
  Banners: {
    Title: 50,
    Description: 150,
    URL: 150,
  },
  Modules: {
    Name: 50,
    Slug: 50,
  },
  Country: {
    Name: 50,
    Code: 10,
    PhoneCode: 6,
    IsoCode: 5,
  },
  State: {
    Name: 100,
    Code: 100,
  },
  City: {
    Name: 100,
    Code: 100,
  },
  Customer: {
    Name: 40,
    Email: 150,
    Mobile: {
      Min: 10,
      Max: 25,
    },
    Status: 150,
  },
  User: {
    FirstName: 50,
    LastName: 50,
    Name: 50,
    Email: 150,
    Mobile: {
      Min: 10,
      Max: 15,
    },
    Status: 150,
  },
  Plan: {
    Name: 150,
    Heading: 150,
  },
  Roles: {
    Name: 50,
    Slug: 50,
  },
  Maximum: {
    Name: 50,
    Address: 150,
    Description: 150,
  },
  Email: {
    Title: 250,
    Code: 250,
    Subject: 500,
    Bcc: 1000,
    Variable: 100,
    Description: 250,
  },
  Company: {
    Name: 50,
    BusinessType: 50,
    Email: 150,
    FAX: 15,
    Maximum: 150,
  },
};

Enum.STATUS = {
  Pending: 'Pending',
  Active: 'Active',
  Inactive: 'Inactive',
  Delete: 'Delete',
};

Enum.ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUB_ADMIN: 'sub_admin',
};

Enum.STATUSES = ['Active', 'Inactive', 'Deleted'];

export default Enum;
