import Country from '../models/country.model';
import ContactUs from '../models/contactUs.model';
import State from '../models/state.model';
import City from '../models/city.model';
import Banner from '../models/banners.model';
import Page from '../models/page.model';

class CommonService {
  getCountries = async (condition, select) => Country.find(condition)
    .select(select)
    .sort('name')
    .lean();

  getStates = async (condition, select) => State.find(condition)
    .select(select)
    .sort('name')
    .lean();

  getCities = async (condition, select) => City.find(condition)
    .select(select)
    .sort('name')
    .lean();

  getBanners = async () => Banner.find({
    active: true,
    deleted: false,
  })
    .select({
      title: 1,
      description: 1,
      image: 1,
      url: 1,
      sort_order: 1,
    })
    .sort('sort_order')
    .limit(3)
    .lean();

  getPage = async (condition, select) => Page.findOne(condition)
    .select(select)
    .lean();

  contactUs = async data => ContactUs.create(data);
}
export default new CommonService();
