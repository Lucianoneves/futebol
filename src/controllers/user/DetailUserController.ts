import { Request, Response } from "express"; 
import { DetailUserService } from "../../services/user/DetailUserService";


class DetailUserController {
    async handle(request: Request, response: Response) {

        const user_id = request.user?.user_id;


        const userDetailService = new DetailUserService();

        const detailuser = await userDetailService.execute(user_id); 

        return response.json(detailuser);
    }

}

export { DetailUserController }